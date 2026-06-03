"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Monitor } from "@phosphor-icons/react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
        <Monitor size={20} weight="light" />
      </button>
    )
  }

  const cycle = () => {
    if (theme === "system") setTheme("light")
    else if (theme === "light") setTheme("dark")
    else setTheme("system")
  }

  const icon =
    theme === "system" ? (
      <Monitor size={20} weight="light" />
    ) : theme === "light" ? (
      <Sun size={20} weight="light" />
    ) : (
      <Moon size={20} weight="light" />
    )

  const label =
    theme === "system" ? "跟随系统" : theme === "light" ? "浅色" : "深色"

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={cycle}
      className="flex items-center gap-2 px-3 py-2 rounded-xl
        bg-zinc-100 hover:bg-zinc-200
        dark:bg-zinc-800 dark:hover:bg-zinc-700
        text-zinc-600 dark:text-zinc-300
        transition-colors text-sm"
      title={`当前: ${label}，点击切换`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
        >
          {icon}
        </motion.div>
      </AnimatePresence>
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  )
}
