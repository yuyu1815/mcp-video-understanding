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
  ToolName,
  isAnalyzeLocalVideoInput,
  isAnalyzeRemoteVideoInput
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
        default:
          throw new Error(`Unknown tool requested: ${request.params.name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Tool execution failed (${toolName}):`, message);
      throw error;
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
