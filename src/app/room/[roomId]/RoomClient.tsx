"use client";

import { useCallback, useEffect, useState } from "react";

type Memo = { id: string; title: string; content: string; updatedAt: string; deletedAt?: string | null };
type Tab = "memos" | "trash";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RoomClient({ roomId }: { roomId: string }) {
  const [tab, setTab] = useState<Tab>("memos");
  const [memos, setMemos] = useState<Memo[]>([]);
  const [trash, setTrash] = useState<Memo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const list = tab === "memos" ? memos : trash;
  const selected = list.find((m) => m.id === selectedId) ?? null;

  const fetchMemos = useCallback(async () => {
    const res = await fetch(`/api/memos?roomId=${roomId}`);
    if (res.ok) setMemos(await res.json());
  }, [roomId]);

  const fetchTrash = useCallback(async () => {
    const res = await fetch(`/api/trash?roomId=${roomId}`);
    if (res.ok) setTrash(await res.json());
  }, [roomId]);

  useEffect(() => {
    fetchMemos();
    fetchTrash();
    const interval = setInterval(() => { fetchMemos(); fetchTrash(); }, 3000);
    return () => clearInterval(interval);
  }, [fetchMemos, fetchTrash]);

  useEffect(() => {
    if (selected) {
      setTitle(selected.title);
      setContent(selected.content);
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function switchTab(t: Tab) {
    setTab(t);
    setSelectedId(null);
    setIsNew(false);
    setTitle("");
    setContent("");
  }

  function openNew() {
    setIsNew(true);
    setSelectedId(null);
    setTitle("");
    setContent("");
  }

  function selectMemo(memo: Memo) {
    setIsNew(false);
    setSelectedId(memo.id);
    setTitle(memo.title);
    setContent(memo.content);
  }

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    if (isNew) {
      const res = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, roomId }),
      });
      if (res.ok) {
        const created: Memo = await res.json();
        await fetchMemos();
        setIsNew(false);
        setSelectedId(created.id);
      }
    } else if (selectedId) {
      await fetch(`/api/memos/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      await fetchMemos();
    }
    setSaving(false);
  }

  async function handleMoveToTrash() {
    if (!selectedId) return;
    await fetch(`/api/memos/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    setTitle("");
    setContent("");
    setIsNew(false);
    await fetchMemos();
    await fetchTrash();
  }

  async function handleRestore() {
    if (!selectedId) return;
    await fetch(`/api/trash/${selectedId}`, { method: "PATCH" });
    setSelectedId(null);
    setTitle("");
    setContent("");
    await fetchMemos();
    await fetchTrash();
  }

  async function handlePermanentDelete() {
    if (!selectedId) return;
    await fetch(`/api/trash/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    setTitle("");
    setContent("");
    setTrash((prev) => prev.filter((m) => m.id !== selectedId));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const dirty = isNew
    ? content.trim().length > 0
    : selected
    ? title !== selected.title || content !== selected.content
    : false;

  return (
    <div className="flex h-[calc(100vh-53px)]">
      {/* サイドバー */}
      <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {/* タブ */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => switchTab("memos")}
            className={`flex-1 py-2.5 text-xs font-medium transition ${
              tab === "memos"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            メモ {memos.length > 0 && <span className="ml-1 text-gray-400">({memos.length})</span>}
          </button>
          <button
            onClick={() => switchTab("trash")}
            className={`flex-1 py-2.5 text-xs font-medium transition ${
              tab === "trash"
                ? "border-b-2 border-red-400 text-red-500 dark:text-red-400"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            ゴミ箱 {trash.length > 0 && <span className="ml-1 text-gray-400">({trash.length})</span>}
          </button>
        </div>

        {tab === "memos" && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={openNew}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
            >
              ＋ 新規メモ
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {list.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8 px-4">
              {tab === "memos" ? "メモがありません" : "ゴミ箱は空です"}
            </p>
          ) : (
            list.map((memo) => (
              <button
                key={memo.id}
                onClick={() => selectMemo(memo)}
                className={`w-full text-left px-3 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                  selectedId === memo.id
                    ? tab === "memos"
                      ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500"
                      : "bg-red-50 dark:bg-red-900/20 border-l-2 border-l-red-400"
                    : ""
                }`}
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                  {memo.title || memo.content.slice(0, 20) || "無題"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{memo.content.slice(0, 30)}</p>
                <p className="text-xs text-gray-300 dark:text-gray-500 mt-0.5">
                  {tab === "trash" && memo.deletedAt ? `削除: ${formatDate(memo.deletedAt)}` : formatDate(memo.updatedAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {isNew || selectedId ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <input
                className="flex-1 text-base font-semibold bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-300 disabled:opacity-60"
                placeholder="タイトル（任意）"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={tab === "trash"}
              />
              <div className="flex gap-2 ml-3">
                <button
                  onClick={handleCopy}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {copied ? "コピー済み!" : "コピー"}
                </button>
                {tab === "trash" ? (
                  <>
                    <button
                      onClick={handleRestore}
                      className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      復元
                    </button>
                    <button
                      onClick={handlePermanentDelete}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      完全削除
                    </button>
                  </>
                ) : (
                  <>
                    {!isNew && (
                      <button
                        onClick={handleMoveToTrash}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        削除
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving || !content.trim() || !dirty}
                      className="text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
                    >
                      {saving ? "保存中..." : "保存"}
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              className="flex-1 w-full px-6 py-5 bg-transparent outline-none resize-none text-base text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 leading-relaxed disabled:opacity-60"
              placeholder="ここにメモを入力... (Ctrl+Enter で保存)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
              }}
              disabled={tab === "trash"}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-4xl mb-3">{tab === "trash" ? "🗑️" : "📝"}</p>
              <p className="text-sm">
                {tab === "trash" ? "ゴミ箱のメモを選択" : "左の「＋ 新規メモ」またはメモを選択"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
