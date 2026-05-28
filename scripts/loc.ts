#!/usr/bin/env -S deno run --allow-read
const packages = ["packages/api", "packages/web", "packages/shared"];
const exts = [".ts", ".tsx", ".js", ".jsx"];

async function countLines(dir: string): Promise<number> {
  let total = 0;
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      total += await countLines(path);
    } else if (entry.isFile && exts.some((e) => entry.name.endsWith(e))) {
      const text = await Deno.readTextFile(path);
      total += text.split("\n").length;
    }
  }
  return total;
}

let grandTotal = 0;
for (const pkg of packages) {
  const lines = await countLines(pkg);
  grandTotal += lines;
  console.log(`${pkg.padEnd(20)} ${lines.toLocaleString()} lines`);
}
console.log("-".repeat(32));
console.log(`${"TOTAL".padEnd(20)} ${grandTotal.toLocaleString()} lines`);
