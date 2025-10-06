export const DEFAULT_PROMPT = "この動画を3文で要約してください。";
export const DEFAULT_MODEL_NAME = "gemini-2.5-flash";
export const MAX_INLINE_FILE_BYTES = 20 * 1024 * 1024; // 20MB limit recommended for inline uploads

export type ToolName =
  | "analyzeLocalVideo"
  | "analyzeRemoteVideo"
  | "checkEnvironment";

export interface AnalyzeLocalVideoInput {
  filePath: string;
  prompt?: string;
  mimeType?: string;
  model?: string;
}

export interface AnalyzeRemoteVideoInput {
  videoUrl: string;
  prompt?: string;
  model?: string;
}

export const ANALYZE_LOCAL_VIDEO_INPUT_SCHEMA = {
  type: "object",
  properties: {
    filePath: {
      type: "string",
      description: "Absolute or relative path to a local video file (≤ 20MB).",
    },
    prompt: {
      type: "string",
      description: "Optional custom instruction for Gemini video analysis.",
      default: DEFAULT_PROMPT,
    },
    mimeType: {
      type: "string",
      description: "MIME type for the provided file (defaults to video/mp4).",
      default: "video/mp4",
    },
    model: {
      type: "string",
      description: "Override Gemini model name (defaults to gemini-2.5-flash).",
    },
  },
  required: ["filePath"],
  additionalProperties: false,
} as const;

export const CHECK_ENVIRONMENT_INPUT_SCHEMA = {
  type: "object",
  properties: {},
  required: [],
  additionalProperties: false,
} as const;

export const ANALYZE_REMOTE_VIDEO_INPUT_SCHEMA = {
  type: "object",
  properties: {
    videoUrl: {
      type: "string",
      format: "uri",
      description: "Remote video URL supported by Gemini (e.g., YouTube).",
    },
    prompt: {
      type: "string",
      description: "Optional custom instruction for Gemini video analysis.",
      default: DEFAULT_PROMPT,
    },
    model: {
      type: "string",
      description: "Override Gemini model name (defaults to gemini-2.5-flash).",
    },
  },
  required: ["videoUrl"],
  additionalProperties: false,
} as const;

export function resolvePrompt(prompt?: string): string {
  if (prompt && prompt.trim().length > 0) {
    return prompt.trim();
  }
  return DEFAULT_PROMPT;
}

export function isAnalyzeLocalVideoInput(
  value: unknown,
): value is AnalyzeLocalVideoInput {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.filePath !== "string") {
    return false;
  }
  if (candidate.prompt !== undefined && typeof candidate.prompt !== "string") {
    return false;
  }
  if (
    candidate.mimeType !== undefined &&
    typeof candidate.mimeType !== "string"
  ) {
    return false;
  }
  if (candidate.model !== undefined && typeof candidate.model !== "string") {
    return false;
  }
  return true;
}

export function isCheckEnvironmentInput(
  value: unknown,
): value is Record<string, never> {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value !== "object") {
    return false;
  }
  return Object.keys(value as Record<string, unknown>).length === 0;
}

export function isAnalyzeRemoteVideoInput(
  value: unknown,
): value is AnalyzeRemoteVideoInput {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.videoUrl !== "string") {
    return false;
  }
  if (candidate.prompt !== undefined && typeof candidate.prompt !== "string") {
    return false;
  }
  if (candidate.model !== undefined && typeof candidate.model !== "string") {
    return false;
  }
  return true;
}
