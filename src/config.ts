import { DEFAULT_MODEL_NAME, MAX_INLINE_FILE_BYTES } from "./types.js";

export interface AppConfig {
  apiKey: string;
  model: string;
  maxInlineFileBytes: number;
}

export function loadConfig(): AppConfig {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Environment variable GOOGLE_API_KEY must be set for the Gemini MCP server.");
  }

  const model = process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim().length > 0
    ? process.env.GEMINI_MODEL.trim()
    : DEFAULT_MODEL_NAME;

  return {
    apiKey: apiKey.trim(),
    model,
    maxInlineFileBytes: MAX_INLINE_FILE_BYTES
  };
}
