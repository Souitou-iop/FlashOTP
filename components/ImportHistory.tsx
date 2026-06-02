"use client"

import { useState, useCallback } from "react"
import { Clock, ArrowClockwise, Trash } from "@phosphor-icons/react"
import { useLocalStorage } from "@/lib/useLocalStorage"

interface ImportRecord {
  id: string
  fileName: string
  count: number
  timestamp: number
}

interface ImportHistoryProps {
  onReimport: (fileName: string) => void
}

export function ImportHistory({ onReimport }: ImportHistoryProps) {
  const [history, setHistory] = useLocalStorage<ImportRecord[]>(
    "import-history",
    []
  )
  const [expanded, setExpanded] = useState(false)

  // 添加导入记录
  const addRecord = useCallback(
    (fileName: string, count: number) => {
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          fileName,
          count,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 9), // 只保留最近 10 条
      ])
    },
    [setHistory]
  )

  // 清除历史
  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  if (history.length === 0) return null

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock size={16} weight="light" className="text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            导入历史
          </span>
          <span className="text-xs text-zinc-400">
            {history.length} 条记录
          </span>
        </div>
        <span className="text-xs text-zinc-400">
          {expanded ? "收起" : "展开"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <div className="max-h-60 overflow-y-auto">
            {history.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                    {record.fileName}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {record.count} 个条目 · {formatTime(record.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => onReimport(record.fileName)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  title="重新导入"
                >
                  <ArrowClockwise size={14} weight="light" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 p-2">
            <button
              onClick={clearHistory}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash size={12} weight="light" />
              清除历史
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return "刚刚"
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return new Date(timestamp).toLocaleDateString("zh-CN")
}
