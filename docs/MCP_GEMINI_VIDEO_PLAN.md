# Gemini Video MCP Server Implementation Plan

## 1. Goals & Scope
- Build a TypeScript MCP server that surfaces Gemini video understanding capabilities through standard MCP tools.
- Support both local MP4 ingestion (≤ 20 MB, inline base64 upload) and remote video URLs (YouTube, Google Drive public links).
- Provide flexible prompts (summary, scene description, custom instructions) while hiding Gemini SDK plumbing from MCP clients.

## 2. Target Use Cases
1. **Quick Summary** – Return a three-sentence overview of a short clip.
2. **Scene Breakdown** – Describe key scenes or transitions for meeting recordings or demos.
3. **Custom Prompting** – Allow analysts to pass arbitrary instructions (e.g., “list all spoken action items”).
4. **Compliance Check (Future)** – Flag pre-defined events (e.g., safety violations) once policy prompts are established.

## 3. Dependencies & Environment
- Runtime: Node.js 18+ (ES2022 features).
- Packages: `@modelcontextprotocol/sdk`, `@google/genai`, development-time `typescript`, `@types/node`.
- Secrets: `.env` の `GOOGLE_API_KEY` を `dotenv` で読み込む。`.env` に未設定の場合は `~/.zshrc` の `export GOOGLE_API_KEY=...` をフォールバックとして読む。
- Build outputs: `./build/index.js` (ESM) with executable bit set for CLI usage.

## 4. High-Level Architecture
```
+------------------+     +-----------------------------+     +---------------------------+
| MCP Client       | --> | MCP Server (TypeScript)     | --> | Gemini Video Understanding |
| (Claude Desktop) |     |  - Tool registry            |     |  - gemini-2.5-flash model |
|                  | <-- |  - Request routing          | <-- |  - Inline / URL inputs    |
+------------------+     |  - Error mapping            |     +---------------------------+
                         +-----------------------------+
```

### Modules
- `src/index.ts` – Entry point: bootstraps `Server` and `StdioServerTransport`.
- `src/server.ts` – Registers tools, dispatches `CallTool` to handlers.
- `src/geminiClient.ts` – Wraps `GoogleGenAI` operations for inline data and URL inputs.
- `src/types.ts` – Defines TypeScript interfaces for tool inputs/outputs & validation helpers.
- `src/utils/file.ts` – Local file existence + size checks + Base64 conversion.
- `src/config.ts` – `dotenv` で読み込まれた環境変数を検証する。

## 5. MCP Tool Design
| Tool Name | Purpose | Input Schema (JSON Schema excerpt) | Output |
|-----------|---------|-------------------------------------|--------|
| `analyzeLocalVideo` | Summarise or describe uploaded local MP4 | `{ type: "object", properties: { filePath: { type: "string" }, prompt: { type: "string", default: "この動画を3文で要約してください。" } }, required: ["filePath"] }` | Text block with Gemini response |
| `analyzeRemoteVideo` | Process hosted video by URL (YouTube, etc.) | `{ type: "object", properties: { videoUrl: { type: "string", format: "uri" }, prompt: { type: "string", default: "この動画を3文で要約してください。" } }, required: ["videoUrl"] }` | Text block |
| `checkEnvironment` | Return current configuration status (masked API key, active model). | `{ type: "object", properties: {}, additionalProperties: false }` | Text block |
| `describeSegments` (optional Phase 2) | Request scene-by-scene descriptions | `{ type: "object", properties: { source: { type: "string" }, segments: { type: "array", items: { type: "object", properties: { start: { type: "number" }, end: { type: "number" } }, required: ["start","end"] } }, prompt: { type: "string" } }, required: ["source","segments"] }` | Text (JSON string) |

## 6. Request Handling Flow
1. MCP client issues `ListTools` → `server.ts` replies with tool metadata.
2. `CallTool` arrives → validate against TypeScript types & JSON schema (manually or via `zod` in later iteration).
3. For local videos:
   - Ensure file exists & below 20 MB.
   - Read file → Base64 encode.
   - Construct Gemini `contents`: `[ { inlineData: { mimeType: "video/mp4", data } }, { text: prompt } ]`.
4. For remote URLs:
   - Build `contents`: `[ prompt, { fileData: { fileUri: videoUrl } } ]`.
5. Invoke `ai.models.generateContent({ model: "gemini-2.5-flash", contents })`.
6. Return `content: [{ type: "text", text: responseText }]` to MCP client.
7. Catch errors, map to human-readable text and include context (e.g., validation failure, Gemini API error code).

## 7. Error Handling & Logging
- Wrap Gemini calls in try/catch; log detailed errors with `console.error` (stderr) including request id when available.
- Return MCP error text summarizing cause (e.g., "Gemini API Error: PERMISSION_DENIED – API key invalid").
- Validate env vars at startup; exit with code 1 if `GOOGLE_API_KEY` missing.
- For local files >20 MB, fail fast with guidance to use future Files API integration.

## 8. Configuration & Secrets
- Runtime expects `.env` または `~/.zshrc` に定義された `GOOGLE_API_KEY` が読み込まれていること。
- Allow optional `MODEL_NAME` env override (default `gemini-2.5-flash`).
- Document necessary IAM/project setup for Gemini API access (Google AI Studio).

## 9. Testing Strategy
- Unit-level: mock `GoogleGenAI` using dependency injection; verify handler returns proper MCP payloads.
- Integration script: Node-based harness sending synthetic `ListTools`/`CallTool` requests through stdio, using small sample MP4 and a public video URL.
- Manual run: `npm run build` → `node build/index.js` and connect via MCP client (Claude Desktop) to confirm real Gemini responses (requires valid API key and network access).

## 10. Milestones & Task Breakdown
1. **Project Setup** – Initialize package, TypeScript config, lint baseline (0.5d).
2. **Gemini Client Wrapper** – Implement env handling, inline/URL helpers, unit tests (0.5d).
3. **MCP Server Skeleton** – Create server, register initial tools, stub handlers (0.5d).
4. **Tool Implementations** – Wire handlers to Gemini wrapper, add validation & logging (1d).
5. **Testing & QA** – Automated tests + manual runbook creation (0.5d).
6. **Documentation & Release** – README updates, usage instructions, configuration guide (0.5d).

## 11. Future Enhancements
- Integrate Gemini Files API for large uploads (>20 MB).
- Add configurable prompt templates and multi-modal outputs (text + structured JSON).
- Provide caching layer for repeat analyses of the same video.
- Extend toolset for transcript extraction once Gemini exposes structured outputs.
