import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { resolve, basename, extname } from "path";

const ALLOWED_FILES = new Set([
  "index.js",
  "openclaw.plugin.json",
  "package.json",
  "recall-hook.js",
  "capture-hook.js",
  "handler.js",
  "openclaw-hook.json",
]);

function contentTypeFor(file: string): string {
  const ext = extname(file);
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  return "text/plain; charset=utf-8";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params;
  const safeFile = basename(file);

  if (!ALLOWED_FILES.has(safeFile)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pluginFile = resolve(process.cwd(), "..", "..", "plugin", safeFile);
  if (!existsSync(pluginFile)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const body = readFileSync(pluginFile, "utf-8");
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentTypeFor(safeFile),
      "Cache-Control": "no-cache",
    },
  });
}
