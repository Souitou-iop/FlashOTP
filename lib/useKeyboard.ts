"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcuts {
  onPaste?: () => void
  onScan?: () => void
  onAdd?: () => void
  onEscape?: () => void
}

export function useKeyboard({
  onPaste,
  onScan,
  onAdd,
  onEscape,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl/Cmd + V: 粘贴导入
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && onPaste) {
        // 只在没有焦点在输入框时触发
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault()
          onPaste()
        }
      }

      // Ctrl/Cmd + K: 扫码
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && onScan) {
        e.preventDefault()
        onScan()
      }

      // Ctrl/Cmd + N: 添加
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && onAdd) {
        e.preventDefault()
        onAdd()
      }

      // Escape: 关闭
      if (e.key === "Escape" && onEscape) {
        onEscape()
      }
    },
    [onPaste, onScan, onAdd, onEscape]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
