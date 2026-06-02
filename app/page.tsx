"use client"

import { useCallback, useState } from "react"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { QRCodeSVG } from "qrcode.react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { FileUploader } from "@/components/FileUploader"
import { QrGrid } from "@/components/QrGrid"
import { EmptyState } from "@/components/EmptyState"
import { SecurityWarning } from "@/components/SecurityWarning"
import { TempMfaPanel } from "@/components/TempMfaPanel"
import { SearchBar } from "@/components/SearchBar"
import { PasswordGate } from "@/components/PasswordGate"
import { parseMfaJson, parseOtpUri } from "@/lib/parser"
import { categorize } from "@/lib/categorizer"
import type { CategorizedEntry } from "@/lib/types"
import { ShieldCheck, ArrowLeft, FileArrowDown, Clock, Lock } from "@phosphor-icons/react"

type Tab = "import" | "temp"

export default function Home() {
  const [tab, setTab] = useState<Tab>("import")
  const [entries, setEntries] = useState<CategorizedEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // 搜索过滤
  const filteredEntries = entries.filter((entry) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.issuer.toLowerCase().includes(q)
    )
  })

  const handleFileLoad = useCallback((text: string) => {
    try {
      setError(null)
      const backup = parseMfaJson(text)

      const categorized: CategorizedEntry[] = backup.entries.map((entry) => {
        const parsed = parseOtpUri(entry.content.uri)
        const category = categorize(entry.content.name, parsed.issuer)
        return {
          id: entry.id,
          name: entry.content.name,
          issuer: parsed.issuer,
          uri: entry.content.uri,
          parsed,
          category,
        }
      })

      setEntries(categorized)
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件解析失败")
    }
  }, [])

  const handleDownloadAll = useCallback(async () => {
    const zip = new JSZip()
    const svgEls = document.querySelectorAll("[data-qr-entry]")

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const container = svgEls[i]
      const svg = container?.querySelector("svg")
      if (!svg) continue

      const canvas = document.createElement("canvas")
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext("2d")!

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 512, 512)

      const svgData = new XMLSerializer().serializeToString(svg)

      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 512, 512)
          canvas.toBlob((blob) => {
            if (blob) {
              zip.file(`${entry.issuer || entry.name}.png`, blob)
            }
            resolve()
          }, "image/png")
        }
        img.onerror = () => resolve()
        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
      })
    }

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, "mfa-qrcodes.zip")
  }, [entries])

  const handleReset = useCallback(() => {
    setEntries([])
    setError(null)
  }, [])

  // 删除导入条目
  const handleDeleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return (
    <div className="min-h-dvh flex flex-col">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-zinc-50/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-2">
            {tab === "import" && entries.length > 0 && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors mr-1"
              >
                <ArrowLeft size={18} weight="light" />
              </button>
            )}
            <ShieldCheck
              size={22}
              weight="light"
              className="text-emerald-500"
            />
            <span className="font-medium text-sm">MFA 管理器</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* 标签切换 */}
        <div className="flex items-center gap-1 p-1 mb-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit mx-auto">
          <button
            onClick={() => setTab("import")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "import"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <FileArrowDown size={16} weight="light" />
            导入文件
          </button>
          <button
            onClick={() => setTab("temp")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "temp"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Clock size={16} weight="light" />
            临时 MFA
          </button>
        </div>

        {/* 内容区域 */}
        {tab === "import" ? (
          entries.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center pt-4 pb-2">
                <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">
                  MFA 二维码管理器
                </h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  导入备份文件，自动生成可导出的 QR 码
                </p>
              </div>

              <FileUploader onFileLoad={handleFileLoad} />

              {error && (
                <div className="max-w-xl mx-auto p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <EmptyState />
              <SecurityWarning />
            </div>
          ) : (
            <div className="space-y-4">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="搜索服务名称或账户..."
              />
              <SecurityWarning />
              {/* 隐藏的 QR 容器用于批量下载 */}
              <div className="fixed -left-[9999px] top-0" aria-hidden="true">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} data-qr-entry>
                    <QRCodeSVG value={entry.uri} size={512} level="M" />
                  </div>
                ))}
              </div>
              <QrGrid entries={filteredEntries} onDownloadAll={handleDownloadAll} onDelete={handleDeleteEntry} />
            </div>
          )
        ) : (
          <PasswordGate onUnlock={() => {}}>
            <TempMfaPanel />
          </PasswordGate>
        )}
      </main>

      {/* 底部 */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4">
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          所有数据仅在浏览器本地处理，不会上传到服务器
        </p>
      </footer>
    </div>
  )
}
