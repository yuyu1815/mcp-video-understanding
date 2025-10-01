# Gemini API 動画理解機能 TypeScript実装ガイド

## 概要

Gemini APIの動画理解機能をTypeScriptで実装する方法についてのドキュメントです。

参照元: https://ai.google.dev/gemini-api/docs/video-understanding?hl=ja

## 必要なパッケージ

```bash
npm install @google/genai
```

## 環境変数の設定

```bash
export GOOGLE_API_KEY="your-api-key-here"
```

## 実装方法

### 1. 動画ファイルのアップロードと処理

```typescript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

// Google AI クライアントの初期化
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

async function processVideoFile(videoPath: string) {
  // 動画ファイルをbase64に変換
  const base64VideoFile = fs.readFileSync(videoPath, {
    encoding: "base64"
  });

  // APIリクエスト用のコンテンツを準備
  const contents = [
    {
      inlineData: {
        mimeType: "video/mp4",
        data: base64VideoFile
      }
    },
    {
      text: "この動画を3文で要約してください。"
    }
  ];

  // Geminiモデルを使用してコンテンツを生成
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents
  });

  console.log(response.text);
}
```

### 2. YouTube URLを使用した処理

```typescript
async function processYouTubeVideo(videoUrl: string) {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      "この動画を3文で要約してください。",
      {
        fileData: {
          fileUri: videoUrl
        }
      }
    ]
  });

  console.log(result.response.text());
}
```

## 重要な実装詳細

1. **ライブラリ**: `@google/genai` を使用
2. **サポート形式**: インライン動画データとYouTube URLの両方に対応
3. **エンコーディング**: 動画ファイルのbase64エンコーディングを処理
4. **推奨モデル**: `gemini-2.5-flash` を使用
5. **カスタマイズ**: 動画分析用のカスタムプロンプトが可能

## ベストプラクティス

- **ファイルサイズ制限**: インライン処理では動画ファイルを20MB以下に保つ
- **大容量ファイル**: より大きな動画にはFiles APIを使用
- **プロンプトのカスタマイズ**: 特定の分析ニーズに合わせてプロンプトをカスタマイズ
- **エラーハンドリング**: try/catchブロックで潜在的なエラーを処理

## 完全な実装例

```typescript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

async function analyzeVideo(videoPath: string, prompt: string) {
  try {
    const base64VideoFile = fs.readFileSync(videoPath, {
      encoding: "base64"
    });

    const contents = [
      {
        inlineData: {
          mimeType: "video/mp4",
          data: base64VideoFile
        }
      },
      { text: prompt }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents
    });

    return response.text;
  } catch (error) {
    console.error("動画処理エラー:", error);
    throw error;
  }
}

// 使用例
analyzeVideo("./sample-video.mp4", "この動画の主要なシーンを説明してください。")
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

## 注意事項

- Google AI API keyの設定が必要
- 必要な依存関係のインストールが必要
- 動画のファイル形式とサイズに注意
