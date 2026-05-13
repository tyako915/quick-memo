"use client";

import { useCallback, useEffect, useState } from "react";

type Memo = { id: string; title: string; content: string; updatedAt: string };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RoomClient({ roomId }: { roomId: string }) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const selected = memos.find((m) => m.id === selectedId) ?? null;

  const fetchMemos = useCallback(async () => {
    const res = await fetch(`/api/memos?roomId=${roomId}`);
    if (!res.ok) return;
    setMemos(await res.json());
  }, [roomId]);

  useEffect(() => {
    fetchMemos();
    const interval = setInterval(fetchMemos, 3000);
    return () => clearInterval(interval);
  }, [fetchMemos]);

  useEffect(() => {
    if (selected && !isNew) {
      setTitle(selected.title);
      setContent(selected.content);
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleDelete() {
    if (!selectedId) return;
    await fetch(`/api/memos/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    setTitle("");
    setContent("");
    setIsNew(false);
    setMemos((prev) => prev.filter((m) => m.id !== selectedId));
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
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={openNew}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
          >
            ＋ 新規メモ
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {memos.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8 px-4">メモがありません</p>
          ) : (
            memos.map((memo) => (
              <button
                key={memo.id}
                onClick={() => selectMemo(memo)}
                className={`w-full text-left px-3 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                  selectedId === memo.id
                    ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500"
                    : ""
                }`}
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                  {memo.title || memo.content.slice(0, 20) || "無題"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{memo.content.slice(0, 30)}</p>
                <p className="text-xs text-gray-300 dark:text-gray-500 mt-0.5">{formatDate(memo.updatedAt)}</p>
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
                className="flex-1 text-base font-semibold bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-300"
                placeholder="タイトル（任意）"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex gap-2 ml-3">
                <button
                  onClick={handleCopy}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {copied ? "コピー済み!" : "コピー"}
                </button>
                {!isNew && (
                  <button
                    onClick={handleDelete}
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
              </div>
            </div>
            <textarea
              className="flex-1 w-full px-6 py-5 bg-transparent outline-none resize-none text-base text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 leading-relaxed"
              placeholder="ここにメモを入力... (Ctrl+Enter で保存)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
              }}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm">左の「＋ 新規メモ」またはメモを選択</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
