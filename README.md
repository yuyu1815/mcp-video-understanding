# MCP Video Understanding Project

## プロジェクトの概要
このプロジェクトは、マルチモーダルコンピュータビジョン（MCP）技術を使用したビデオ理解システムを開発しています。

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
git clone https://github.com/your-username/mcp-video-understanding.git
cd mcp-video-understanding
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
`.env.example` を参考に `.env` ファイルを作成し、`GOOGLE_API_KEY` を設定してください。`dotenv` により起動時に自動で読み込まれます。

## 使用方法
```bash
npm start
```

### MCPツール
- `checkEnvironment`: `.env` から読み込んだ `GOOGLE_API_KEY` と利用モデルを確認できます。
- `analyzeLocalVideo`: ローカル動画を要約します。
- `analyzeRemoteVideo`: 公開URLの動画を分析します。

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
[ライセンス情報を追加]