"use client"

import { QRCodeSVG } from "qrcode.react"
import { Download, Copy, Check, Pencil, Trash } from "@phosphor-icons/react"
import { useCallback, useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import * as OTPAuth from "otpauth"
import type { CategorizedEntry } from "@/lib/types"

interface QrListItemProps {
  entry: CategorizedEntry
  onEdit?: (entry: CategorizedEntry) => void
  onDelete?: (id: string) => void
}

export function QrListItem({ entry, onEdit, onDelete }: QrListItemProps) {
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState("")
  const svgRef = useRef<HTMLDivElement>(null)

  // 生成 TOTP 验证码
  useEffect(() => {
    const parsed = entry.parsed
    if (!parsed.secret) return

    const totp = new OTPAuth.TOTP({
      issuer: parsed.issuer,
      label: parsed.label,
      algorithm: parsed.algorithm as "SHA1" | "SHA256" | "SHA512",
      digits: parsed.digits,
      period: parsed.period,
      secret: OTPAuth.Secret.fromBase32(parsed.secret),
    })

    const update = () => {
      setCode(totp.generate())
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [entry])

  const handleDownload = useCallback(() => {
    const svgEl = svgRef.current?.querySelector("svg")
    if (!svgEl) return

    const canvas = document.createElement("canvas")
    const size = 512
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!

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
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-center gap-4 p-4 rounded-xl
        bg-white dark:bg-zinc-900
        border border-zinc-200 dark:border-zinc-800
        hover:border-zinc-300 dark:hover:border-zinc-700
        transition-colors"
    >
      {/* QR 码 */}
      <div ref={svgRef} className="p-2 bg-white rounded-lg shrink-0">
        <QRCodeSVG value={entry.uri} size={64} level="M" bgColor="#ffffff" fgColor="#18181b" />
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {entry.issuer || entry.name}
        </p>
        {entry.issuer && entry.issuer !== entry.name && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {entry.name}
          </p>
        )}
        {entry.tag && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full
            bg-emerald-100 dark:bg-emerald-900/30
            text-emerald-600 dark:text-emerald-400">
            {entry.tag}
          </span>
        )}
      </div>

      {/* 验证码 */}
      {code && (
        <div className="text-right shrink-0">
          <p className="text-lg font-mono font-bold tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
            {code.slice(0, 3)} {code.slice(3)}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">TOTP</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-lg
            bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700
            text-zinc-500 dark:text-zinc-400
            transition-colors"
          title="下载"
        >
          <Download size={14} weight="light" />
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg
            bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700
            text-zinc-500 dark:text-zinc-400
            transition-colors"
          title="复制 URI"
        >
          {copied ? (
            <Check size={14} weight="light" className="text-emerald-500" />
          ) : (
            <Copy size={14} weight="light" />
          )}
        </button>
      </div>
    </motion.div>
  )
}
