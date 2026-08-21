/**
 * User-related types
 */

export type UserPlan = "free" | "pro";

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  tokenVersion: number;
  plan: UserPlan;
  stripeCustomerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface UserGoals {
  id: string;
  userId: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goalWeightKg: number | null;
  createdAt: Date;
  updatedAt: Date;
}
