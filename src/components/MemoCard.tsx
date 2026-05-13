"use client";

import { useState } from "react";

type Memo = { id: string; title: string; content: string; updatedAt: string };

type Props = {
  memo: Memo;
  onUpdate: (id: string, title: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function MemoCard({ memo, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    await onUpdate(memo.id, title, content);
    setEditing(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(memo.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-2">
      {editing ? (
        <>
          <input
            className="text-sm font-semibold w-full bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none pb-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル（任意）"
          />
          <textarea
            className="text-sm w-full bg-transparent outline-none resize-none min-h-[80px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </>
      ) : (
        <>
          {memo.title && (
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{memo.title}</p>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
            {memo.content}
          </p>
          <div className="flex gap-2 justify-end mt-1">
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {copied ? "コピー済み!" : "コピー"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              編集
            </button>
            <button
              onClick={() => onDelete(memo.id)}
              className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              削除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
