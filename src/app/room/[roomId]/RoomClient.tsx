"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Memo = {
  id: string; title: string; content: string;
  pinned: boolean; updatedAt: string; deletedAt?: string | null; daysLeft?: number;
};
type Tab = "memos" | "trash";
type SaveStatus = "idle" | "saving" | "saved";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function RoomClient({ roomId }: { roomId: string }) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [trash, setTrash] = useState<Memo[]>([]);
  const [tab, setTab] = useState<Tab>("memos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNewRef = useRef(isNew);
  const selectedIdRef = useRef(selectedId);
  isNewRef.current = isNew;
  selectedIdRef.current = selectedId;

  const selected = (tab === "memos" ? memos : trash).find((m) => m.id === selectedId) ?? null;

  // SSE接続
  useEffect(() => {
    let es: EventSource;

    function connect() {
      es = new EventSource(`/api/events?roomId=${roomId}`);

      es.addEventListener("init", (e) => {
        const { memos: m, trash: t } = JSON.parse(e.data);
        setMemos(m);
        setTrash(t);
      });
      es.addEventListener("update", (e) => {
        const { memos: m, trash: t } = JSON.parse(e.data);
        setMemos(m);
        setTrash(t);
      });
      es.onerror = () => {
        es.close();
        setTimeout(connect, 3000);
      };
    }

    connect();
    return () => es?.close();
  }, [roomId]);

  // 選択メモが切り替わったらエディタに反映
  useEffect(() => {
    if (selected && !isNew) {
      setTitle(selected.title);
      setContent(selected.content);
      setSaveStatus("idle");
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 自動保存（1.5秒デバウンス）
  const scheduleAutoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (!newContent.trim()) return;

      autoSaveTimer.current = setTimeout(async () => {
        setSaveStatus("saving");
        if (isNewRef.current) {
          const res = await fetch("/api/memos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, content: newContent, roomId }),
          });
          if (res.ok) {
            const created: Memo = await res.json();
            setIsNew(false);
            setSelectedId(created.id);
          }
        } else if (selectedIdRef.current) {
          await fetch(`/api/memos/${selectedIdRef.current}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, content: newContent }),
          });
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      }, 1500);
    },
    [roomId]
  );

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!isNew && !selected) return;
    const isDirty = isNew ? v !== "" || content !== "" : v !== (selected?.title ?? "") || content !== (selected?.content ?? "");
    if (isDirty) { setSaveStatus("idle"); scheduleAutoSave(v, content); }
  }

  function handleContentChange(v: string) {
    setContent(v);
    setSaveStatus("idle");
    scheduleAutoSave(title, v);
  }

  function openNew() {
    setIsNew(true);
    setSelectedId(null);
    setTitle("");
    setContent("");
    setPreview(false);
    setSaveStatus("idle");
    setSidebarOpen(false);
  }

  function selectMemo(memo: Memo) {
    setIsNew(false);
    setSelectedId(memo.id);
    setTitle(memo.title);
    setContent(memo.content);
    setPreview(false);
    setSaveStatus("idle");
    setSidebarOpen(false);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setSelectedId(null);
    setIsNew(false);
    setTitle("");
    setContent("");
  }

  async function handlePin(memo: Memo, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/memos/${memo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !memo.pinned }),
    });
  }

  async function handleMoveToTrash() {
    if (!selectedId) return;
    await fetch(`/api/memos/${selectedId}`, { method: "DELETE" });
    setSelectedId(null); setTitle(""); setContent("");
  }

  async function handleRestore() {
    if (!selectedId) return;
    await fetch(`/api/trash/${selectedId}`, { method: "PATCH" });
    setSelectedId(null); setTitle(""); setContent("");
    setTab("memos");
  }

  async function handlePermanentDelete() {
    if (!selectedId) return;
    await fetch(`/api/trash/${selectedId}`, { method: "DELETE" });
    setSelectedId(null); setTitle(""); setContent("");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // 検索フィルタリング
  const filteredMemos = memos.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q);
  });
  const filteredTrash = trash.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q);
  });
  const displayList = tab === "memos" ? filteredMemos : filteredTrash;

  const saveLabel =
    saveStatus === "saving" ? "保存中..." :
    saveStatus === "saved" ? "保存済み ✓" :
    "保存";

  return (
    <div className="flex h-screen flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* モバイル ハンバーガー */}
          <button
            className="md:hidden p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <a href="/" className="text-base font-bold text-gray-900 dark:text-white hover:opacity-80">
            QuickMemo
          </a>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded font-mono hidden sm:block">
            {roomId}
          </code>
          <CopyUrlButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* モバイル オーバーレイ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* サイドバー */}
        <aside
          className={`
            fixed md:static z-30 h-[calc(100vh-53px)] md:h-full
            w-72 md:w-64 shrink-0
            border-r border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-800 flex flex-col
            transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* 検索ボックス */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="メモを検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm pl-7 pr-7 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-400"
              />
              <svg className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* タブ */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
            {(["memos", "trash"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2 text-xs font-medium transition ${
                  tab === t
                    ? t === "memos"
                      ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-b-2 border-red-400 text-red-500"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {t === "memos" ? `メモ${memos.length ? ` (${memos.length})` : ""}` : `ゴミ箱${trash.length ? ` (${trash.length})` : ""}`}
              </button>
            ))}
          </div>

          {tab === "memos" && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={openNew}
                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
              >
                ＋ 新規メモ
              </button>
            </div>
          )}

          {/* メモ一覧 */}
          <div className="overflow-y-auto flex-1">
            {displayList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-8 px-4">
                {search ? "一致するメモがありません" : tab === "memos" ? "メモがありません" : "ゴミ箱は空です"}
              </p>
            ) : (
              displayList.map((memo) => (
                <button
                  key={memo.id}
                  onClick={() => selectMemo(memo)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group ${
                    selectedId === memo.id
                      ? tab === "memos"
                        ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500"
                        : "bg-red-50 dark:bg-red-900/20 border-l-2 border-l-red-400"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate flex-1">
                      {memo.pinned && <span className="text-yellow-500 mr-1">📌</span>}
                      {memo.title || memo.content.slice(0, 20) || "無題"}
                    </p>
                    {tab === "memos" && (
                      <button
                        onClick={(e) => handlePin(memo, e)}
                        className={`shrink-0 opacity-0 group-hover:opacity-100 transition text-xs px-1 rounded ${
                          memo.pinned ? "opacity-100 text-yellow-500" : "text-gray-400 hover:text-yellow-500"
                        }`}
                      >
                        📌
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{memo.content.slice(0, 35)}</p>
                  <p className="text-xs text-gray-300 dark:text-gray-500 mt-0.5">
                    {tab === "trash" && memo.deletedAt
                      ? `${memo.daysLeft}日後に完全削除`
                      : formatDate(memo.updatedAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* メインエリア */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
          {isNew || selectedId ? (
            <>
              {/* ツールバー */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                <input
                  className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-300 disabled:opacity-50"
                  placeholder="タイトル（任意）"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  disabled={tab === "trash"}
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* 保存ステータス */}
                  <span className={`text-xs hidden sm:block ${
                    saveStatus === "saved" ? "text-green-500" :
                    saveStatus === "saving" ? "text-gray-400" : "text-transparent"
                  }`}>
                    {saveLabel}
                  </span>

                  {/* 編集/プレビュー切り替え */}
                  {tab === "memos" && (
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
                      <button
                        onClick={() => setPreview(false)}
                        className={`px-2.5 py-1 ${!preview ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => setPreview(true)}
                        className={`px-2.5 py-1 ${preview ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                      >
                        プレビュー
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleCopy}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    {copied ? "✓" : "コピー"}
                  </button>

                  {tab === "trash" ? (
                    <>
                      <button onClick={handleRestore} className="text-xs px-2.5 py-1 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">復元</button>
                      <button onClick={handlePermanentDelete} className="text-xs px-2.5 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">完全削除</button>
                    </>
                  ) : (
                    !isNew && (
                      <button onClick={handleMoveToTrash} className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">削除</button>
                    )
                  )}
                </div>
              </div>

              {/* エディタ / プレビュー */}
              {preview ? (
                <div className="flex-1 overflow-y-auto px-6 py-5 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || "*プレビューするコンテンツがありません*"}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className="flex-1 w-full px-6 py-5 bg-transparent outline-none resize-none text-base text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 leading-relaxed disabled:opacity-50"
                  placeholder={tab === "trash" ? "" : "ここにメモを入力... (Markdown対応)"}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
                      scheduleAutoSave(title, content);
                    }
                  }}
                  disabled={tab === "trash"}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-4xl mb-3">{tab === "trash" ? "🗑️" : "📝"}</p>
                <p className="text-sm">
                  {tab === "trash" ? "ゴミ箱のメモを選択" : "「＋ 新規メモ」またはメモを選択"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyUrlButton() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
      {copied ? "コピー済み!" : "URLコピー"}
    </button>
  );
}
