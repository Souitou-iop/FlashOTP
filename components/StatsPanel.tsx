"use client"

import { useMemo } from "react"
import type { CategorizedEntry, Category } from "@/lib/types"
import { CATEGORIES } from "@/lib/types"
import {
  ChartLineUp,
  Wallet,
  Cloud,
  Robot,
  ChatCircle,
  CreditCard,
  Envelope,
  GameController,
  DotsSix,
  ChartBar,
} from "@phosphor-icons/react"

const ICON_MAP: Record<string, React.ElementType> = {
  ChartLineUp,
  Wallet,
  Cloud,
  Robot,
  ChatCircle,
  CreditCard,
  Envelope,
  GameController,
  DotsSix,
}

interface StatsPanelProps {
  entries: CategorizedEntry[]
}

export function StatsPanel({ entries }: StatsPanelProps) {
  const stats = useMemo(() => {
    // 按分类统计
    const byCategory = entries.reduce(
      (acc, entry) => {
        const cat = entry.category
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      {} as Record<Category, number>
    )

    // 按标签统计
    const byTag = entries.reduce(
      (acc, entry) => {
        if (entry.tag) {
          acc[entry.tag] = (acc[entry.tag] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>
    )

    // 排序后的分类
    const sortedCategories = CATEGORIES
      .filter((c) => byCategory[c.id])
      .sort((a, b) => (byCategory[b.id] || 0) - (byCategory[a.id] || 0))

    // 排序后的标签
    const sortedTags = Object.entries(byTag)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    return {
      total: entries.length,
      categories: sortedCategories,
      categoryCounts: byCategory,
      tags: sortedTags,
    }
  }, [entries])

  if (entries.length === 0) return null

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <ChartBar size={18} weight="light" className="text-zinc-400" />
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">数据统计</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 总数 */}
        <div className="text-center">
          <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100">
            {stats.total}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">总数</p>
        </div>

        {/* 分类数 */}
        <div className="text-center">
          <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100">
            {stats.categories.length}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">分类</p>
        </div>

        {/* 标签数 */}
        <div className="text-center">
          <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100">
            {stats.tags.length}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">标签</p>
        </div>

        {/* 最大分类 */}
        <div className="text-center">
          <p className="text-lg font-light text-zinc-900 dark:text-zinc-100 truncate">
            {stats.categories[0]
              ? CATEGORIES.find((c) => c.id === stats.categories[0].id)?.label.slice(0, 4)
              : "-"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">最多</p>
        </div>
      </div>

      {/* 分类分布条 */}
      {stats.categories.length > 1 && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">分类分布</p>
          <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            {stats.categories.map((cat) => {
              const count = stats.categoryCounts[cat.id] || 0
              const percent = (count / stats.total) * 100
              const colors: Record<string, string> = {
                "crypto-exchange": "bg-amber-500",
                "crypto-wallet": "bg-orange-500",
                "cloud": "bg-blue-500",
                "ai": "bg-purple-500",
                "social": "bg-pink-500",
                "finance": "bg-green-500",
                "email": "bg-cyan-500",
                "gaming": "bg-red-500",
                "other": "bg-zinc-400",
              }
              return (
                <div
                  key={cat.id}
                  className={`${colors[cat.id] || "bg-zinc-400"}`}
                  style={{ width: `${percent}%` }}
                  title={`${cat.label}: ${count}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* 标签列表 */}
      {stats.tags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">热门标签</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.tags.map(([tag, count]) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full
                  bg-zinc-100 dark:bg-zinc-800
                  text-zinc-600 dark:text-zinc-400"
              >
                {tag}
                <span className="text-zinc-400 dark:text-zinc-500">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
