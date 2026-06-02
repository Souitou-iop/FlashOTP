"use client"

import { GridFour, List } from "@phosphor-icons/react"

type ViewMode = "grid" | "list"

interface ViewToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
      <button
        onClick={() => onChange("grid")}
        className={`p-1.5 rounded-md transition-colors ${
          mode === "grid"
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
        title="网格视图"
      >
        <GridFour size={16} weight="light" />
      </button>
      <button
        onClick={() => onChange("list")}
        className={`p-1.5 rounded-md transition-colors ${
          mode === "list"
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
        title="列表视图"
      >
        <List size={16} weight="light" />
      </button>
    </div>
  )
}
