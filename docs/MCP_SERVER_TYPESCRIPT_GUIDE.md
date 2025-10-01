# MCP サーバー TypeScript実装ガイド

## 概要

Model Context Protocol (MCP) サーバーをTypeScriptで実装する方法についてのドキュメントです。

参照元: https://zenn.dev/zaki_yama/articles/mcp-server-getting-started

## 開発環境のセットアップ

### 1. プロジェクトの初期化

```bash
mkdir mcp-server-quickstart
cd mcp-server-quickstart
npm init -y
npm install @modelcontextprotocol/sdk
npm install -D @types/node typescript
```

### 2. package.json の設定

```json
{
  "type": "module",
  "bin": {
    "my-mcp-server": "./build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod 755 build/index.js"
  }
}
```

### 3. tsconfig.json の作成

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true
  }
}
```

## 基本的なサーバー実装

### 必要なモジュールのインポート

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
```

### サーバーインスタンスの作成

```typescript
const server = new Server(
  {
    name: "weather",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
```

### ツールの定義

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_forecast",
        description: "指定された場所の天気予報を取得します",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "緯度"
            },
            longitude: {
              type: "number",
              description: "経度"
            },
            days: {
              type: "number",
              description: "予報日数（1-7日）",
              minimum: 1,
              maximum: 7
            }
          },
          required: ["latitude", "longitude"]
        }
      }
    ]
  };
});
```

### ツールの実行処理

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_forecast") {
    const { latitude, longitude, days = 3 } = request.params.arguments as {
      latitude: number;
      longitude: number;
      days?: number;
    };

    // ツールのロジックを実装
    const result = await fetchWeatherForecast(latitude, longitude, days);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});
```

### サーバーの起動

```typescript
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

## 完全な実装例

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// サーバーインスタンスの作成
const server = new Server(
  {
    name: "weather-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 利用可能なツールのリスト
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_forecast",
        description: "指定された場所の天気予報を取得します",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "緯度"
            },
            longitude: {
              type: "number",
              description: "経度"
            },
            days: {
              type: "number",
              description: "予報日数（1-7日）",
              minimum: 1,
              maximum: 7
            }
          },
          required: ["latitude", "longitude"]
        }
      },
      {
        name: "get_current_weather",
        description: "現在の天気を取得します",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "都市名"
            }
          },
          required: ["city"]
        }
      }
    ]
  };
});

// ツール呼び出しの処理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_forecast": {
      const { latitude, longitude, days = 3 } = args as {
        latitude: number;
        longitude: number;
        days?: number;
      };

      // 実際のAPIコールなどの処理をここに実装
      const forecast = {
        location: { latitude, longitude },
        days: days,
        forecast: "晴れ、気温25度"
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(forecast, null, 2)
          }
        ]
      };
    }

    case "get_current_weather": {
      const { city } = args as { city: string };

      const weather = {
        city: city,
        temperature: 22,
        condition: "曇り"
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(weather, null, 2)
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// サーバーの起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

## ビルドと実行

### ビルド

```bash
npm run build
```

### Claude Desktopでの設定

`~/Library/Application Support/Claude/claude_desktop_config.json` に追加:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/path/to/mcp-server-quickstart/build/index.js"]
    }
  }
}
```

## 主要な概念

### 1. Server
MCPサーバーの基本クラス。サーバーの名前、バージョン、機能を定義します。

### 2. Transport
クライアントとサーバー間の通信方法を定義。`StdioServerTransport`が標準入出力を使用します。

### 3. Tools
MCPサーバーが提供する機能。各ツールには名前、説明、入力スキーマが必要です。

### 4. Request Handlers
クライアントからのリクエストを処理するハンドラー。`ListToolsRequestSchema`と`CallToolRequestSchema`が主要なハンドラーです。

## ベストプラクティス

1. **エラーハンドリング**: すべてのツール実行で適切なエラー処理を実装
2. **バリデーション**: 入力パラメータのバリデーションを徹底
3. **型安全性**: TypeScriptの型システムを活用
4. **ログ出力**: `console.error`を使用してデバッグ情報を出力（stdoutは通信に使用）
5. **ドキュメント**: 各ツールの説明と入力スキーマを詳細に記述

## トラブルシューティング

### サーバーが起動しない場合
- `build/index.js`に実行権限があるか確認
- `package.json`の`bin`フィールドが正しく設定されているか確認

### ツールが認識されない場合
- `ListToolsRequestSchema`ハンドラーが正しく実装されているか確認
- 入力スキーマのフォーマットが正しいか確認

### 通信エラーが発生する場合
- `StdioServerTransport`が正しく初期化されているか確認
- Claude Desktopの設定ファイルのパスが正しいか確認
