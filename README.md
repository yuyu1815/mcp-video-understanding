# MCP Video Understanding Project

## プロジェクトの概要
このプロジェクトは、Model Context Protocol (MCP) サーバーとして動作し、Gemini APIを使用したビデオ理解機能を提供します。

## 主な機能
- ビデオからの意味理解
- マルチモーダル分析
- 高度な機械学習モデルの統合

## セットアップ方法

### 前提条件
- Node.js (v18以上)
- npm

### インストール手順
1. リポジトリをクローン
```bash
git clone https://github.com/shin902/mcp-video-understanding.git
cd mcp-video-understanding
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
`.env.example` を参考に `.env` ファイルを作成し、`GOOGLE_API_KEY` を設定してください。`dotenv` により起動時に自動で読み込まれます。

    もしくは、`~/.zshrc` に `export GOOGLE_API_KEY="your_api_key"` を追加してシェルの環境変数として定義することもできます。`.env` に値がなくても、サーバーは `~/.zshrc` を読み取ってキーを解決します。

### MCP サーバーの設定

Claude Desktop などの MCP クライアントで使用する場合、設定ファイルに以下を追加してください：

```json
{
  "mcpServers": {
    "gemini-video": {
      "command": "npx",
      "args": ["mcp-video-understanding"],
      "env": {
        "GOOGLE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**API キーを設定ファイルに直接書きたくない場合**は、`~/.zshrc` (または `~/.bashrc`) に以下を追加してください：

```bash
export GOOGLE_API_KEY="your_api_key_here"
```

その場合、MCP サーバーの設定は `env` を空にできます：

```json
{
  "mcpServers": {
    "gemini-video": {
      "command": "npx",
      "args": ["mcp-video-understanding"],
      "env": {}
    }
  }
}
```

**注意**: 環境によっては `npx` のフルパスが必要な場合があります。ターミナルで `which npx` を実行してパスを確認してください。例：
- `/usr/local/bin/npx` (一般的なインストール)
- `/opt/homebrew/bin/npx` (Apple Silicon Mac の Homebrew)
- `/Users/your-username/.local/share/mise/shims/npx` (mise 使用時)

## ビルド
```bash
npm run build
```

ビルドされたファイルは `build/` ディレクトリに出力されます。

## 使用方法

### スタンドアロンで実行
```bash
npm start
```

### MCPツール

#### `checkEnvironment`
`.env` から読み込んだ `GOOGLE_API_KEY` と利用モデルを確認できます。

#### `analyzeLocalVideo`
ローカル動画を要約します（最大20MBまで対応）。

**デフォルトプロンプト**:
```
最初にこの記事全体を要約し全体像を掴んだ後、大きなセクションごとに細かく要約を行ってください。
その次に小さなセクションごとに更に詳細な要約を行ってください。
```

このプロンプトは網羅的な要約に最適です。カスタムプロンプトを指定することも可能です。

**対応する動画**:
全ての動画に対応してます。
- 音声付きの解説動画など（通常の動画）
- 音声なし動画（映像のみ）
- Music Video（映像がメインの動画）

Gemini のマルチモーダル動画理解により、様々な形式の動画を適切に分析できます。

#### `analyzeRemoteVideo`
公開URLの動画を分析します。使用方法は `analyzeLocalVideo` と同様です。

**YouTube動画の制限**:
以下のYouTube動画はURLを指定しても取得できません：
- 非公開動画
- 限定公開動画
- 配信のアーカイブ

完全に公開されている動画のみ分析可能です。

### 使用モデル
デフォルトは `gemini-2.5-flash` を使用します。`gemini-2.5-pro` や `gemini-2.5-flash-lite` も選択可能です。

## 開発
```bash
npm run dev
```

## テスト
```bash
npm test
```

## コントリビューション
プルリクエストは歓迎します。大きな変更を行う前に、まずissueで議論してください。

## ライセンス
MIT
