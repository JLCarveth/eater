/**
 * Authentication utilities using JWT with HTTP-only cookies
 */

import { create, verify, getNumericDate, decode } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { encodeHex } from "$std/encoding/hex.ts";
import type { User, JWTPayload } from "@nutrition-llama/shared";
import {
  getUserById,
  getUserByEmail,
  createUser,
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  createPasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,
  updateUserPassword,
  getUserWithPasswordById,
  getUserTokenVersion,
} from "./db.ts";

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const PASSWORD_RESET_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

// Get JWT signing keys from environment
async function getAccessTokenKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ACCESS_TOKEN_SECRET");
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET not set");

  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function getRefreshTokenKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("REFRESH_TOKEN_SECRET");
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET not set");

  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Password hashing using bcrypt-like approach with Web Crypto
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = encodeHex(salt);

  // Derive key from password using PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashHex = encodeHex(new Uint8Array(derivedBits));
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, expectedHash] = storedHash.split(":");
  if (!saltHex || !expectedHash) return false;

  // Decode salt from hex
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );

  // Derive key from password using PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashHex = encodeHex(new Uint8Array(derivedBits));
  return hashHex === expectedHash;
}

// JWT functions
export async function createAccessToken(user: User): Promise<string> {
  const key = await getAccessTokenKey();

  const payload = {
    userId: user.id,
    email: user.email,
    tokenVersion: user.tokenVersion,
    exp: getNumericDate(ACCESS_TOKEN_EXPIRY),
    iat: getNumericDate(0),
  };

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

export async function createRefreshTokenForUser(user: User): Promise<string> {
  const key = await getRefreshTokenKey();

  const payload = {
    userId: user.id,
    type: "refresh",
    exp: getNumericDate(REFRESH_TOKEN_EXPIRY),
    iat: getNumericDate(0),
  };

  const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

  // Store token hash in database
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
  await createRefreshToken(user.id, tokenHash, expiresAt);

  return token;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hashBuffer));
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const key = await getAccessTokenKey();
    const payload = await verify(token, key) as unknown as JWTPayload;

    // Access tokens are otherwise stateless and would outlive a password
    // change; reject tokens issued under an older token_version so all other
    // sessions are cut off immediately, not at expiry
    const currentVersion = await getUserTokenVersion(payload.userId);
    if (currentVersion === null || payload.tokenVersion !== currentVersion) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

const UNAUTHORIZED = JSON.stringify({ error: "Unauthorized" });
const JSON_HEADERS = { "Content-Type": "application/json" };

export async function getAuthPayload(req: Request): Promise<JWTPayload | Response> {
  const accessToken = getCookie(req, "access_token");
  if (!accessToken) {
    return new Response(UNAUTHORIZED, { status: 401, headers: JSON_HEADERS });
  }
  const payload = await verifyAccessToken(accessToken);
  if (!payload) {
    return new Response(UNAUTHORIZED, { status: 401, headers: JSON_HEADERS });
  }
  return payload;
}

export async function verifyRefreshTokenAndGetUser(
  token: string
): Promise<User | null> {
  try {
    const key = await getRefreshTokenKey();
    const payload = await verify(token, key);

    // Check if token is in database and not revoked
    const tokenHash = await hashToken(token);
    const storedToken = await getRefreshToken(tokenHash);

    if (!storedToken) return null;
    if (storedToken.revokedAt) return null;
    if (new Date() > storedToken.expiresAt) return null;

    return await getUserById((payload as { userId: string }).userId);
  } catch {
    return null;
  }
}

export async function revokeUserRefreshToken(token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  await revokeRefreshToken(tokenHash);
}

// Cookie helpers
export function setAuthCookies(
  headers: Headers,
  accessToken: string,
  refreshToken: string
): void {
  // Access token cookie
  headers.append(
    "Set-Cookie",
    `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ACCESS_TOKEN_EXPIRY}`
  );

  // Refresh token cookie
  headers.append(
    "Set-Cookie",
    `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${REFRESH_TOKEN_EXPIRY}`
  );
}

export function clearAuthCookies(headers: Headers): void {
  headers.append(
    "Set-Cookie",
    "access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
  );
  headers.append(
    "Set-Cookie",
    "refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
  );
}

export function getCookie(req: Request, name: string): string | null {
  const cookies = req.headers.get("cookie");
  if (!cookies) return null;

  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

// Auth middleware helper
interface AuthResult {
  user: User | null;
  redirect: Response | null;
}

export async function requireAuth(req: Request): Promise<AuthResult> {
  const accessToken = getCookie(req, "access_token");

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      const user = await getUserById(payload.userId);
      if (user) {
        return { user, redirect: null };
      }
    }
  }

  // Access token invalid or missing - try refresh token
  const refreshToken = getCookie(req, "refresh_token");
  if (refreshToken) {
    const user = await verifyRefreshTokenAndGetUser(refreshToken);
    if (user) {
      // Issue new access token
      const newAccessToken = await createAccessToken(user);
      const headers = new Headers({
        Location: req.url,
      });
      headers.append(
        "Set-Cookie",
        `access_token=${newAccessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ACCESS_TOKEN_EXPIRY}`
      );

      // Redirect to same page with new cookie
      return {
        user: null,
        redirect: new Response(null, { status: 302, headers }),
      };
    }
  }

  // No valid tokens - redirect to login
  return {
    user: null,
    redirect: new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    }),
  };
}

// Registration
export async function registerUser(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  // Check if user already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("User already exists");
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  return await createUser(email, passwordHash, displayName);
}

// Login
export async function loginUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  // Return user without password hash
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    tokenVersion: user.tokenVersion,
    plan: user.plan,
    stripeCustomerId: user.stripeCustomerId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Password reset
export async function createPasswordResetTokenForUser(user: User): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = encodeHex(bytes);

  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY * 1000);
  await createPasswordResetToken(user.id, tokenHash, expiresAt);

  return token;
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const tokenHash = await hashToken(token);
  const stored = await getPasswordResetToken(tokenHash);

  if (!stored) return false;
  if (stored.usedAt) return false;
  if (new Date() > stored.expiresAt) return false;

  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(stored.userId, passwordHash);
  await markPasswordResetTokenUsed(tokenHash);

  // Log out all existing sessions for this user
  await revokeAllUserTokens(stored.userId);

  return true;
}

// Verify a logged-in user's password (for sensitive actions like account deletion)
export async function verifyUserPassword(
  userId: string,
  password: string
): Promise<boolean> {
  const user = await getUserWithPasswordById(userId);
  if (!user) return false;
  return await verifyPassword(password, user.passwordHash);
}

// Change password while logged in; returns false if current password is wrong
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const valid = await verifyUserPassword(userId, currentPassword);
  if (!valid) return false;

  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(userId, passwordHash);

  // Log out all existing sessions; caller re-issues tokens for this one
  await revokeAllUserTokens(userId);

  return true;
}

// Get user from request if authenticated (doesn't redirect, for middleware use)
interface OptionalAuthResult {
  user: User | null;
  newAccessToken: string | null;
}

export async function getOptionalUser(req: Request): Promise<OptionalAuthResult> {
  const accessToken = getCookie(req, "access_token");

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      const user = await getUserById(payload.userId);
      if (user) {
        return { user, newAccessToken: null };
      }
    }
  }

  // Access token invalid or missing - try refresh token
  const refreshToken = getCookie(req, "refresh_token");
  if (refreshToken) {
    const user = await verifyRefreshTokenAndGetUser(refreshToken);
    if (user) {
      // Issue new access token
      const newAccessToken = await createAccessToken(user);
      return { user, newAccessToken };
    }
  }

  // No valid tokens
  return { user: null, newAccessToken: null };
}
