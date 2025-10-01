import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import type { AppConfig } from "./config.js";
import { GeminiVideoClient } from "./geminiClient.js";
import {
  ANALYZE_LOCAL_VIDEO_INPUT_SCHEMA,
  ANALYZE_REMOTE_VIDEO_INPUT_SCHEMA,
  CHECK_ENVIRONMENT_INPUT_SCHEMA,
  ToolName,
  isAnalyzeLocalVideoInput,
  isAnalyzeRemoteVideoInput,
  isCheckEnvironmentInput
} from "./types.js";

export function createServer(config: AppConfig): Server {
  const client = new GeminiVideoClient(config);

  const server = new Server(
    {
      name: "gemini-video",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "analyzeLocalVideo",
        description: "ローカルの動画ファイル (20MB 以下) を Gemini で要約します。",
        inputSchema: ANALYZE_LOCAL_VIDEO_INPUT_SCHEMA
      },
      {
        name: "analyzeRemoteVideo",
        description: "YouTube などの公開URLを Gemini で分析します。",
        inputSchema: ANALYZE_REMOTE_VIDEO_INPUT_SCHEMA
      },
      {
        name: "checkEnvironment",
        description: "GOOGLE_API_KEY が読み込まれているか確認し、現在の設定サマリを返します。",
        inputSchema: CHECK_ENVIRONMENT_INPUT_SCHEMA
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name as ToolName;
    const args = request.params.arguments;

    try {
      switch (toolName) {
        case "analyzeLocalVideo": {
          if (!isAnalyzeLocalVideoInput(args)) {
            throw new Error("Invalid arguments for analyzeLocalVideo. Expecting { filePath: string, prompt?: string, mimeType?: string, model?: string }.");
          }
          const resultText = await client.analyzeLocalVideo(args);
          return toToolResponse(resultText, toolName);
        }
        case "analyzeRemoteVideo": {
          if (!isAnalyzeRemoteVideoInput(args)) {
            throw new Error("Invalid arguments for analyzeRemoteVideo. Expecting { videoUrl: string, prompt?: string, model?: string }.");
          }
          const resultText = await client.analyzeRemoteVideo(args);
          return toToolResponse(resultText, toolName);
        }
        case "checkEnvironment": {
          if (!isCheckEnvironmentInput(args)) {
            throw new Error("Invalid arguments for checkEnvironment. No arguments are required.");
          }
          const summary = summarizeConfig(config);
          return toToolResponse(summary, toolName);
        }
        default:
          throw new Error(`Unknown tool requested: ${request.params.name}`);
      }
    } catch (error) {
      const normalized = normalizeError(error);
      logToolError(toolName, args, normalized);
      throw normalized;
    }
  });

  return server;
}

function toToolResponse(text: string, toolName: ToolName) {
  const safeText = text && text.trim().length > 0
    ? text
    : `Gemini returned no textual response for ${toolName}.`;

  return {
    content: [
      {
        type: "text" as const,
        text: safeText
      }
    ]
  };
}

function logToolError(toolName: ToolName, args: unknown, error: Error): void {
  const serializedArgs = safeSerialize(args);
  console.error(`Tool execution failed (${toolName})`, {
    args: serializedArgs,
    message: error.message
  });
  if (error.stack) {
    console.error(error.stack);
  }
}

function safeSerialize(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return "[unserializable arguments]";
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}


function summarizeConfig(config: AppConfig): string {
  const maskedKey = maskApiKey(config.apiKey);
  const lines = [
    "環境変数の読み込み結果:",
    `- GOOGLE_API_KEY: ${maskedKey}`,
    `- モデル: ${config.model}`
  ];
  return lines.join("\n");
}

function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.trim().length === 0) {
    return "未設定";
  }
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return `${trimmed} (長さ: ${trimmed.length})`;
  }
  const head = trimmed.slice(0, 4);
  const tail = trimmed.slice(-2);
  return `${head}…${tail} (長さ: ${trimmed.length})`;
}
