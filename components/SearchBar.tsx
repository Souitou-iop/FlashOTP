"use client"

import { MagnifyingGlass, X } from "@phosphor-icons/react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "搜索..." }: SearchBarProps) {
  return (
    <div className="relative">
      <MagnifyingGlass
        size={16}
        weight="light"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 rounded-xl
          bg-zinc-100 dark:bg-zinc-800
          border border-transparent
          focus:border-emerald-500/50 focus:bg-white dark:focus:bg-zinc-900
          text-zinc-900 dark:text-zinc-100
          placeholder:text-zinc-400 dark:placeholder:text-zinc-500
          focus:outline-none
          text-sm transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <X size={16} weight="light" />
        </button>
      )}
    </div>
  )
}
