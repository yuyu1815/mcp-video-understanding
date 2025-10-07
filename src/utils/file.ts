import { readFile, stat } from "node:fs/promises";
import type { Stats } from "node:fs";
import path from "node:path";

export interface ResolvedFile {
  resolvedPath: string;
  sizeInBytes: number;
}

export async function ensureFileReadable(
  filePath: string,
): Promise<ResolvedFile> {
  const resolvedPath = path.resolve(filePath);
  let fileStat: Stats;
  try {
    fileStat = await stat(resolvedPath);
  } catch (error) {
    throw new Error(`Local video file not found: ${resolvedPath}`);
  }

  if (!fileStat.isFile()) {
    throw new Error(
      `Expected a file but found something else at: ${resolvedPath}`,
    );
  }

  return {
    resolvedPath,
    sizeInBytes: fileStat.size,
  };
}

export interface ReadBase64Result extends ResolvedFile {
  base64Data: string;
}

export async function readFileAsBase64(
  filePath: string,
  maxBytes: number,
): Promise<ReadBase64Result> {
  const { resolvedPath, sizeInBytes } = await ensureFileReadable(filePath);
  if (sizeInBytes > maxBytes) {
    throw new Error(
      `Local video file exceeds inline upload limit (${sizeInBytes} bytes > ${maxBytes} bytes). Use a smaller file or a remote URL.`,
    );
  }

  const buffer = await readFile(resolvedPath);
  return {
    resolvedPath,
    sizeInBytes,
    base64Data: buffer.toString("base64"),
  };
}
