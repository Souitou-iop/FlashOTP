"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function Favicon() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (!favicon) return

    // 使用 resolvedTheme 来处理 system 主题
    const isDark = resolvedTheme === "dark"
    favicon.href = isDark ? "/icon-dark.svg" : "/icon-light.svg"
  }, [theme, resolvedTheme])

  return null
}
