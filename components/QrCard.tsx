"use client"

import { QRCodeSVG } from "qrcode.react"
import { Download, Copy, Check, Pencil, Trash } from "@phosphor-icons/react"
import { useCallback, useRef, useState } from "react"
import type { CategorizedEntry } from "@/lib/types"

interface QrCardProps {
  entry: CategorizedEntry
  onEdit?: (entry: CategorizedEntry) => void
  onDelete?: (id: string) => void
}

export function QrCard({ entry, onEdit, onDelete }: QrCardProps) {
  const [copied, setCopied] = useState(false)
  const svgRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback(() => {
    const svgEl = svgRef.current?.querySelector("svg")
    if (!svgEl) return

    const canvas = document.createElement("canvas")
    const size = 512
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!

    // 白色背景
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size, size)

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${entry.issuer || entry.name}.png`
        a.click()
        URL.revokeObjectURL(url)
      }, "image/png")
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  }, [entry])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(entry.uri).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [entry.uri])

  return (
    <div
      className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl
        bg-white dark:bg-zinc-900
        border border-zinc-200 dark:border-zinc-800
        hover:border-zinc-300 dark:hover:border-zinc-700
        transition-all duration-200"
    >
      {/* 右上角操作按钮 */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded-lg
                bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700
                text-zinc-500 dark:text-zinc-400
                transition-colors"
              title="编辑"
            >
              <Pencil size={14} weight="light" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 rounded-lg
                bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50
                text-red-500 dark:text-red-400
                transition-colors"
              title="删除"
            >
              <Trash size={14} weight="light" />
            </button>
          )}
        </div>
      )}

      <div ref={svgRef} className="p-3 bg-white rounded-xl">
        <QRCodeSVG
          value={entry.uri}
          size={180}
          level="M"
          bgColor="#ffffff"
          fgColor="#18181b"
        />
      </div>

      <div className="w-full text-center space-y-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {entry.issuer || entry.name}
        </p>
        {entry.issuer && entry.issuer !== entry.name && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {entry.name}
          </p>
        )}
        {entry.tag && (
          <span className="inline-block px-2 py-0.5 text-xs rounded-full
            bg-emerald-100 dark:bg-emerald-900/30
            text-emerald-600 dark:text-emerald-400">
            {entry.tag}
          </span>
        )}
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-zinc-100 hover:bg-zinc-200
            dark:bg-zinc-800 dark:hover:bg-zinc-700
            text-zinc-600 dark:text-zinc-300
            transition-colors"
        >
          <Download size={14} weight="light" />
          下载
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-zinc-100 hover:bg-zinc-200
            dark:bg-zinc-800 dark:hover:bg-zinc-700
            text-zinc-600 dark:text-zinc-300
            transition-colors"
        >
          {copied ? (
            <Check size={14} weight="light" className="text-emerald-500" />
          ) : (
            <Copy size={14} weight="light" />
          )}
          {copied ? "已复制" : "复制 URI"}
        </button>
      </div>
    </div>
  )
}
