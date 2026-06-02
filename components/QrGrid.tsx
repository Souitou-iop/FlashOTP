"use client"

import type { CategorizedEntry, Category } from "@/lib/types"
import { CATEGORIES } from "@/lib/types"
import { QrCard } from "./QrCard"
import { StatsPanel } from "./StatsPanel"
import { Button } from "./Button"
import { motion, AnimatePresence } from "framer-motion"
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

interface QrGridProps {
  entries: CategorizedEntry[]
  onDownloadAll: () => void
  onEdit?: (entry: CategorizedEntry) => void
  onDelete?: (id: string) => void
}

export function QrGrid({ entries, onDownloadAll, onEdit, onDelete }: QrGridProps) {
  // 按分类分组
  const grouped = entries.reduce(
    (acc, entry) => {
      const cat = entry.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(entry)
      return acc
    },
    {} as Record<Category, CategorizedEntry[]>
  )

  // 按预定义顺序排列分类
  const orderedCategories = CATEGORIES.filter((c) => grouped[c.id]?.length)

  return (
    <div className="space-y-8">
      {/* 数据统计 */}
      <StatsPanel entries={entries} />

      {/* 顶部操作栏 */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4
          p-5 rounded-2xl
          bg-white dark:bg-zinc-900
          border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-light text-zinc-900 dark:text-zinc-100">
            {entries.length}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            个验证器，{orderedCategories.length} 个分类
          </span>
        </div>
        <Button onClick={onDownloadAll} variant="primary">
          批量下载全部 QR 码
        </Button>
      </div>

      {/* 分类展示 */}
      {orderedCategories.map((catInfo) => {
        const catEntries = grouped[catInfo.id] || []
        const Icon = ICON_MAP[catInfo.icon] || DotsSix

        return (
          <section key={catInfo.id} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Icon
                size={20}
                weight="light"
                className="text-zinc-400 dark:text-zinc-500"
              />
              <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
                {catInfo.label}
              </h2>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {catEntries.length}
              </span>
            </div>

            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence>
                {catEntries.map((entry) => (
                  <QrCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </AnimatePresence>
            </motion.div>
          </section>
        )
      })}
    </div>
  )
}
