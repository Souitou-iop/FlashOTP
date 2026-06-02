"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Plus, DownloadSimple, Trash, FileArrowDown, Pencil, Check, Copy, ClipboardText, Scan } from "@phosphor-icons/react"
import { QRCodeSVG } from "qrcode.react"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import * as OTPAuth from "otpauth"
import { useLocalStorage } from "@/lib/useLocalStorage"
import type { TempMfaEntry } from "@/lib/types"
import { AddMfaModal } from "./AddMfaModal"
import { SecurityWarning } from "./SecurityWarning"
import { SearchBar } from "./SearchBar"
import { QrScanner } from "./QrScanner"

export function TempMfaPanel() {
  const [entries, setEntries] = useLocalStorage<TempMfaEntry[]>(
    "temp-mfa-entries",
    []
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [scannerOpen, setScannerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TempMfaEntry | null>(null)
  const [search, setSearch] = useState("")

  // 搜索过滤
  const filteredEntries = entries.filter((entry) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      entry.issuer.toLowerCase().includes(q) ||
      entry.name.toLowerCase().includes(q) ||
      (entry.tag && entry.tag.toLowerCase().includes(q))
    )
  })

  // 全选/取消全选
  const allSelected = entries.length > 0 && selectedIds.size === entries.length
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(entries.map((e) => e.id)))
    }
  }, [allSelected, entries])

  // 切换单个选择
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // 添加条目
  const handleAdd = useCallback(
    (entry: TempMfaEntry) => {
      setEntries((prev) => [entry, ...prev])
    },
    [setEntries]
  )

  // 从剪贴板粘贴 URI
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) return

      // 解析 otpauth:// URI
      const lines = text
        .split(/[\n\r]+/)
        .map((l) => l.trim())
        .filter((l) => l.startsWith("otpauth://"))

      if (lines.length === 0) {
        alert("剪贴板中没有找到 otpauth:// URI")
        return
      }

      const newEntries: TempMfaEntry[] = lines.map((uri) => {
        const url = new URL(uri)
        const params = url.searchParams
        const label = decodeURIComponent(url.pathname.replace(/^\//, ""))
        const issuer = params.get("issuer") || label.split(":")[0] || ""
        const name = label.includes(":") ? label.split(":").slice(1).join(":") : ""

        return {
          id: crypto.randomUUID(),
          issuer,
          name: decodeURIComponent(name),
          secret: params.get("secret") || "",
          algorithm: (params.get("algorithm") || "SHA1") as "SHA1" | "SHA256" | "SHA512",
          digits: (parseInt(params.get("digits") || "6") as 6 | 8),
          period: (parseInt(params.get("period") || "30") as 30 | 60),
          createdAt: Date.now(),
        }
      })

      setEntries((prev) => [...newEntries, ...prev])
    } catch (err) {
      console.error("粘贴失败:", err)
    }
  }, [setEntries])

  // 扫码导入
  const handleScan = useCallback(
    (uri: string) => {
      try {
        const url = new URL(uri)
        const params = url.searchParams
        const label = decodeURIComponent(url.pathname.replace(/^\//, ""))
        const issuer = params.get("issuer") || label.split(":")[0] || ""
        const name = label.includes(":") ? label.split(":").slice(1).join(":") : ""

        const newEntry: TempMfaEntry = {
          id: crypto.randomUUID(),
          issuer,
          name: decodeURIComponent(name),
          secret: params.get("secret") || "",
          algorithm: (params.get("algorithm") || "SHA1") as "SHA1" | "SHA256" | "SHA512",
          digits: (parseInt(params.get("digits") || "6") as 6 | 8),
          period: (parseInt(params.get("period") || "30") as 30 | 60),
          createdAt: Date.now(),
        }

        setEntries((prev) => [newEntry, ...prev])
        setScannerOpen(false)
      } catch (err) {
        console.error("扫码解析失败:", err)
      }
    },
    [setEntries]
  )

  // 编辑条目
  const handleEdit = useCallback(
    (updated: TempMfaEntry) => {
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      setEditingEntry(null)
    },
    [setEntries]
  )

  // 删除条目
  const handleDelete = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    },
    [setEntries]
  )

  // 删除选中
  const handleDeleteSelected = useCallback(() => {
    setEntries((prev) => prev.filter((e) => !selectedIds.has(e.id)))
    setSelectedIds(new Set())
  }, [setEntries, selectedIds])

  // 获取选中的条目
  const selectedEntries = entries.filter((e) => selectedIds.has(e.id))
  const hasSelection = selectedIds.size > 0

  // 批量下载 QR 码
  const handleDownloadAll = useCallback(async () => {
    const zip = new JSZip()
    const svgEls = document.querySelectorAll("[data-qr-entry]")

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (!selectedIds.has(entry.id)) continue

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
              zip.file(`${entry.issuer || entry.name || "mfa"}.png`, blob)
            }
            resolve()
          }, "image/png")
        }
        img.onerror = () => resolve()
        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
      })
    }

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, "temp-mfa-qrcodes.zip")
  }, [entries, selectedIds])

  // 导出选中为 JSON
  const handleExportJson = useCallback(() => {
    const exportEntries = hasSelection ? selectedEntries : entries

    const backup = {
      version: 1,
      entries: exportEntries.map((entry) => ({
        id: entry.id,
        content: {
          uri: `otpauth://totp/${encodeURIComponent(entry.issuer)}${entry.name ? ":" + encodeURIComponent(entry.name) : ""}?secret=${entry.secret}&issuer=${encodeURIComponent(entry.issuer)}&algorithm=${entry.algorithm}&digits=${entry.digits}&period=${entry.period}`,
          entry_type: "Totp",
          name: entry.name || entry.issuer,
        },
        note: null,
      })),
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    })
    saveAs(blob, `mfa-backup-${new Date().toISOString().slice(0, 10)}.json`)
  }, [entries, selectedEntries, hasSelection])

  // 导出为 Google Authenticator 格式（URI 列表）
  const handleExportGoogleAuth = useCallback(() => {
    const exportEntries = hasSelection ? selectedEntries : entries

    const uris = exportEntries.map((entry) =>
      `otpauth://totp/${encodeURIComponent(entry.issuer)}${entry.name ? ":" + encodeURIComponent(entry.name) : ""}?secret=${entry.secret}&issuer=${encodeURIComponent(entry.issuer)}&algorithm=${entry.algorithm}&digits=${entry.digits}&period=${entry.period}`
    )

    const blob = new Blob([uris.join("\n")], { type: "text/plain" })
    saveAs(blob, `google-auth-${new Date().toISOString().slice(0, 10)}.txt`)
  }, [entries, selectedEntries, hasSelection])

  // 导出为 CSV 格式
  const handleExportCsv = useCallback(() => {
    const exportEntries = hasSelection ? selectedEntries : entries

    const header = "Issuer,Name,Secret,Algorithm,Digits,Period,URI"
    const rows = exportEntries.map((entry) => {
      const uri = `otpauth://totp/${encodeURIComponent(entry.issuer)}${entry.name ? ":" + encodeURIComponent(entry.name) : ""}?secret=${entry.secret}&issuer=${encodeURIComponent(entry.issuer)}&algorithm=${entry.algorithm}&digits=${entry.digits}&period=${entry.period}`
      return `"${entry.issuer}","${entry.name}","${entry.secret}","${entry.algorithm}",${entry.digits},${entry.period},"${uri}"`
    })

    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    saveAs(blob, `mfa-export-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [entries, selectedEntries, hasSelection])

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      {entries.length > 0 && (
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="搜索服务名称或账户..."
        />
      )}

      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-light text-zinc-900 dark:text-zinc-100">
            {filteredEntries.length}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            个临时条目
          </span>
          {hasSelection && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              已选 {selectedIds.size} 项
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                  bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                  text-zinc-600 dark:text-zinc-300
                  transition-colors"
              >
                {allSelected ? "取消全选" : "全选"}
              </button>

              {hasSelection && (
                <>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                      bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50
                      text-red-600 dark:text-red-400
                      transition-colors"
                  >
                    <Trash size={16} weight="light" />
                    删除选中
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                      bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                      text-zinc-600 dark:text-zinc-300
                      transition-colors"
                  >
                    <DownloadSimple size={16} weight="light" />
                    下载选中
                  </button>
                </>
              )}

              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                    bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                    text-zinc-600 dark:text-zinc-300
                    transition-colors"
                >
                  <FileArrowDown size={16} weight="light" />
                  导出
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 py-1 rounded-xl
                  bg-white dark:bg-zinc-800
                  border border-zinc-200 dark:border-zinc-700
                  shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all z-10">
                  <button onClick={handleExportJson} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    JSON 格式
                  </button>
                  <button onClick={handleExportGoogleAuth} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    URI 列表
                  </button>
                  <button onClick={handleExportCsv} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    CSV 格式
                  </button>
                </div>
              </div>
            </>
          )}
          <button
            onClick={handlePasteFromClipboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
              bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
              text-zinc-600 dark:text-zinc-300
              transition-colors"
            title="从剪贴板粘贴 otpauth:// URI"
          >
            <ClipboardText size={16} weight="light" />
            粘贴
          </button>
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
              bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
              text-zinc-600 dark:text-zinc-300
              transition-colors"
            title="扫描 QR 码"
          >
            <Scan size={16} weight="light" />
            扫码
          </button>
          <button
            onClick={() => {
              setEditingEntry(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm
              bg-emerald-500 hover:bg-emerald-600 text-white
              transition-colors"
          >
            <Plus size={16} weight="light" />
            添加
          </button>
        </div>
      </div>

      {/* QR 码网格 */}
      {entries.length > 0 ? (
        <>
          {/* 隐藏的 QR 容器用于批量下载 */}
          <div className="fixed -left-[9999px] top-0" aria-hidden="true">
            {entries.map((entry) => {
              const uri = `otpauth://totp/${encodeURIComponent(entry.issuer)}${entry.name ? ":" + encodeURIComponent(entry.name) : ""}?secret=${entry.secret}&issuer=${encodeURIComponent(entry.issuer)}&algorithm=${entry.algorithm}&digits=${entry.digits}&period=${entry.period}`
              return (
                <div key={entry.id} data-qr-entry>
                  <QRCodeSVG value={uri} size={512} level="M" />
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEntries.map((entry) => (
              <TempQrCard
                key={entry.id}
                entry={entry}
                selected={selectedIds.has(entry.id)}
                onToggleSelect={toggleSelect}
                onDelete={handleDelete}
                onEdit={(e) => {
                  setEditingEntry(e)
                  setModalOpen(true)
                }}
              />
            ))}
          </div>

          {search && filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">
                没有找到匹配的条目
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Plus
            size={48}
            weight="light"
            className="text-zinc-300 dark:text-zinc-600 mb-4"
          />
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            还没有临时 MFA 条目
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            点击「添加」按钮手动添加 MFA 验证器
          </p>
        </div>
      )}

      <SecurityWarning />

      {/* 添加/编辑模态框 */}
      <AddMfaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingEntry(null)
        }}
        onAdd={handleAdd}
        editEntry={editingEntry}
        onEdit={handleEdit}
      />

      {/* 扫码组件 */}
      {scannerOpen && (
        <QrScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}

// TOTP 验证码组件
function TotpCode({ entry }: { entry: TempMfaEntry }) {
  const [code, setCode] = useState("")
  const [nextCode, setNextCode] = useState("")
  const [remaining, setRemaining] = useState(0)
  const [copied, setCopied] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const totp = new OTPAuth.TOTP({
      issuer: entry.issuer,
      label: entry.name || entry.issuer,
      algorithm: entry.algorithm,
      digits: entry.digits,
      period: entry.period,
      secret: OTPAuth.Secret.fromBase32(entry.secret),
    })

    const update = () => {
      const now = Math.floor(Date.now() / 1000)
      const token = totp.generate()
      const remainingSeconds = entry.period - (now % entry.period)

      // 生成下一个验证码（模拟下一个时间窗口）
      const nextToken = totp.generate({ timestamp: (now + remainingSeconds) * 1000 })

      setCode(token)
      setNextCode(nextToken)
      setRemaining(remainingSeconds)
    }

    update()
    intervalRef.current = setInterval(update, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [entry])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [code])

  // 进度条百分比
  const progressPercent = (remaining / entry.period) * 100
  const isLowTime = remaining <= 5

  return (
    <div className="w-full space-y-3">
      {/* 当前验证码 */}
      <div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">当前验证码</div>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl
            bg-zinc-50 dark:bg-zinc-800/50
            border border-zinc-200 dark:border-zinc-700
            hover:border-emerald-300 dark:hover:border-emerald-600
            transition-colors group"
        >
          <span className="text-3xl font-mono font-bold tracking-[0.3em] text-zinc-900 dark:text-zinc-100">
            {code.slice(0, 3)} {code.slice(3)}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors">
            {copied ? "已复制" : "点击复制"}
          </span>
        </button>
      </div>

      {/* 下一个验证码预览 */}
      <div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">下一个验证码</div>
        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl
          bg-zinc-50/50 dark:bg-zinc-800/30
          border border-dashed border-zinc-200 dark:border-zinc-700"
        >
          <span className="text-lg font-mono font-medium tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {nextCode.slice(0, 3)} {nextCode.slice(3)}
          </span>
          <span className="text-xs text-zinc-300 dark:text-zinc-600">
            即将生效
          </span>
        </div>
      </div>

      {/* 倒计时进度条 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              isLowTime
                ? "bg-red-500 dark:bg-red-400"
                : "bg-emerald-500 dark:bg-emerald-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className={`text-xs font-mono tabular-nums min-w-[24px] text-right ${
          isLowTime
            ? "text-red-500 dark:text-red-400"
            : "text-zinc-400 dark:text-zinc-500"
        }`}>
          {remaining}s
        </span>
      </div>
    </div>
  )
}

// 临时 MFA 专用的 QR 卡片（带选择、编辑、删除按钮和验证码）
function TempQrCard({
  entry,
  selected,
  onToggleSelect,
  onDelete,
  onEdit,
}: {
  entry: TempMfaEntry
  selected: boolean
  onToggleSelect: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (entry: TempMfaEntry) => void
}) {
  const uri = `otpauth://totp/${encodeURIComponent(entry.issuer)}${entry.name ? ":" + encodeURIComponent(entry.name) : ""}?secret=${entry.secret}&issuer=${encodeURIComponent(entry.issuer)}&algorithm=${entry.algorithm}&digits=${entry.digits}&period=${entry.period}`

  const handleDownload = useCallback(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")!

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, 512, 512)

    const svgEl = document.querySelector(`[data-temp-qr="${entry.id}"] svg`)
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 512, 512)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${entry.issuer || "mfa"}.png`
        a.click()
        URL.revokeObjectURL(url)
      }, "image/png")
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  }, [entry])

  return (
    <div
      className={`group relative flex flex-col items-center gap-4 p-6 pt-14 rounded-2xl
        bg-white dark:bg-zinc-900
        border-2 transition-all duration-200
        ${selected
          ? "border-emerald-500 dark:border-emerald-400"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
        }`}
    >
      {/* 左上角选择框 */}
      <button
        onClick={() => onToggleSelect(entry.id)}
        className={`absolute top-3 left-3 w-5 h-5 rounded-md border-2 flex items-center justify-center
          transition-colors
          ${selected
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-400"
          }`}
      >
        {selected && <Check size={12} weight="bold" />}
      </button>

      {/* 右上角操作按钮 */}
      <div className="absolute top-3 right-3 flex gap-1">
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
      </div>

      {/* QR 码 */}
      <div ref={(el) => { if (el) el.setAttribute("data-temp-qr", entry.id) }} className="p-3 bg-white rounded-xl">
        <QRCodeSVG value={uri} size={160} level="M" bgColor="#ffffff" fgColor="#18181b" />
      </div>

      {/* 服务名称 */}
      <div className="w-full text-center space-y-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {entry.issuer}
        </p>
        {entry.name && (
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

      {/* TOTP 验证码 */}
      <TotpCode entry={entry} />

      {/* 操作按钮 */}
      <div className="flex gap-2 w-full">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-zinc-100 hover:bg-zinc-200
            dark:bg-zinc-800 dark:hover:bg-zinc-700
            text-zinc-600 dark:text-zinc-300
            transition-colors"
        >
          <DownloadSimple size={14} weight="light" />
          下载
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(uri)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-zinc-100 hover:bg-zinc-200
            dark:bg-zinc-800 dark:hover:bg-zinc-700
            text-zinc-600 dark:text-zinc-300
            transition-colors"
        >
          <Copy size={14} weight="light" />
          URI
        </button>
      </div>
    </div>
  )
}
