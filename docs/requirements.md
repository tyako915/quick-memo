# メモ共有アプリ 要件定義書

**バージョン**: 1.0  
**作成日**: 2026-05-13  
**ステータス**: MVP

---

## 1. プロジェクト概要

### 目的
複数のOS・デバイス間でテキストメモをリアルタイムに共有・参照できる軽量なWebアプリケーション。

### 対象ユーザー
- 複数デバイス（Windows / Mac / Linux / スマートフォン）を使い分けている個人ユーザー
- デバイス間でテキストを素早くコピー＆ペーストしたいユーザー

---

## 2. 技術スタック

| 項目 | 採用技術 |
|------|----------|
| フロントエンド | Next.js (App Router) |
| スタイリング | Tailwind CSS |
| データベース | Neon Postgres (Vercel Marketplace) |
| ORM | Prisma |
| 認証 | NextAuth.js (GitHub OAuth) |
| ホスティング | Vercel |
| ソース管理 | GitHub |

---

## 3. 機能要件

### MVP スコープ（必須機能）

#### 3.1 認証
- [ ] GitHub OAuth でのサインイン / サインアウト
- [ ] 未認証ユーザーはメモの閲覧・作成不可

#### 3.2 メモ管理
- [ ] メモの新規作成（タイトル + 本文）
- [ ] メモ一覧の表示（作成日時降順）
- [ ] メモの編集
- [ ] メモの削除

#### 3.3 リアルタイム同期
- [ ] 作成・編集・削除をページリロードなしで即時反映（Polling または Server-Sent Events）

#### 3.4 クリップボード連携
- [ ] メモ本文をワンクリックでクリップボードにコピー

#### 3.5 UI
- [ ] レスポンシブデザイン（スマートフォン対応）
- [ ] ダークモード対応

### MVP 対象外（将来機能）
- メモの共有（他ユーザーへの公開）
- タグ・カテゴリ分類
- ファイル添付
- チーム/コラボレーション機能

---

## 4. 非機能要件

| 項目 | 目標値 |
|------|--------|
| ページ初期表示 | 2秒以内（LCP） |
| 同期遅延 | 3秒以内 |
| 可用性 | Vercel 標準 SLA に準拠 |
| セキュリティ | 認証済みユーザーのみ自分のメモにアクセス可能 |

---

## 5. データモデル

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  memos     Memo[]
  createdAt DateTime @default(now())
}

model Memo {
  id        String   @id @default(cuid())
  title     String   @default("")
  content   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 6. 画面構成

```
/                  → ランディング（未認証時: サインインボタン）
/dashboard         → メモ一覧 + 新規作成フォーム（認証必須）
/memo/[id]         → メモ詳細・編集（認証必須）
```

---

## 7. API エンドポイント（Route Handlers）

| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/memos | メモ一覧取得 |
| POST | /api/memos | メモ新規作成 |
| PUT | /api/memos/[id] | メモ更新 |
| DELETE | /api/memos/[id] | メモ削除 |

---

## 8. 開発・デプロイフロー

```
ローカル開発
  └─ main ブランチへ push
       └─ Vercel 自動デプロイ (Preview)
            └─ 確認後 → Production promote
```

### 環境変数（必要なもの）

```
DATABASE_URL          # Neon Postgres 接続文字列
NEXTAUTH_SECRET       # NextAuth 署名キー
GITHUB_ID             # GitHub OAuth App クライアントID
GITHUB_SECRET         # GitHub OAuth App クライアントシークレット
NEXTAUTH_URL          # デプロイ先URL（本番用）
```

---

## 9. マイルストーン

| フェーズ | 内容 | 目安 |
|----------|------|------|
| Phase 1 | プロジェクト初期化・GitHub/Vercel 連携 | 0.5日 |
| Phase 2 | 認証（NextAuth + GitHub OAuth） | 0.5日 |
| Phase 3 | メモ CRUD 実装 | 1日 |
| Phase 4 | リアルタイム同期・UX改善 | 1日 |
| Phase 5 | 本番デプロイ・動作確認 | 0.5日 |

**MVP 合計目安: 約 3〜4 日**
