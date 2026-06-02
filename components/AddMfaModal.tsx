"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Plus } from "@phosphor-icons/react"
import { QRCodeSVG } from "qrcode.react"
import type { TempMfaEntry } from "@/lib/types"

interface AddMfaModalProps {
  open: boolean
  onClose: () => void
  onAdd: (entry: TempMfaEntry) => void
  editEntry?: TempMfaEntry | null
  onEdit?: (entry: TempMfaEntry) => void
}

export function AddMfaModal({ open, onClose, onAdd, editEntry, onEdit }: AddMfaModalProps) {
  const [issuer, setIssuer] = useState("")
  const [name, setName] = useState("")
  const [secret, setSecret] = useState("")
  const [algorithm, setAlgorithm] = useState<"SHA1" | "SHA256" | "SHA512">("SHA1")
  const [digits, setDigits] = useState<6 | 8>(6)
  const [period, setPeriod] = useState<30 | 60>(30)
  const [tag, setTag] = useState("")

  const isEditMode = !!editEntry

  // 编辑模式时填充表单
  useEffect(() => {
    if (editEntry) {
      setIssuer(editEntry.issuer)
      setName(editEntry.name)
      setSecret(editEntry.secret)
      setAlgorithm(editEntry.algorithm)
      setDigits(editEntry.digits)
      setPeriod(editEntry.period)
      setTag(editEntry.tag || "")
    } else {
      setIssuer("")
      setName("")
      setSecret("")
      setAlgorithm("SHA1")
      setDigits(6)
      setPeriod(30)
      setTag("")
    }
  }, [editEntry, open])

  // 清理密钥：只保留 Base32 有效字符（A-Z, 2-7, =）
  const cleanSecret = useCallback((value: string) => {
    return value.toUpperCase().replace(/[^A-Z2-7=]/g, "")
  }, [])

  const isValidSecret = secret.replace(/=/g, "").length >= 16

  const previewUri = issuer && isValidSecret
    ? `otpauth://totp/${encodeURIComponent(issuer)}${name ? ":" + encodeURIComponent(name) : ""}?secret=${secret.toUpperCase()}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}&period=${period}`
    : null

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!issuer || !isValidSecret) return

      if (isEditMode && editEntry && onEdit) {
        onEdit({
          ...editEntry,
          issuer,
          name,
          secret: secret.toUpperCase(),
          algorithm,
          digits,
          period,
          tag: tag || undefined,
        })
      } else {
        onAdd({
          id: crypto.randomUUID(),
          issuer,
          name,
          secret: secret.toUpperCase(),
          algorithm,
          digits,
          period,
          tag: tag || undefined,
          createdAt: Date.now(),
        })
      }

      // 重置表单
      setIssuer("")
      setName("")
      setSecret("")
      setAlgorithm("SHA1")
      setDigits(6)
      setPeriod(30)
      setTag("")
      onClose()
    },
    [issuer, name, secret, algorithm, digits, period, isValidSecret, onAdd, onEdit, onClose, isEditMode, editEntry]
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 模态框 */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {isEditMode ? "编辑 MFA 条目" : "添加 MFA 条目"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
          >
            <X size={20} weight="light" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Issuer */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              服务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="例如：Binance、Google、GitHub"
              className="w-full px-3 py-2.5 rounded-xl
                bg-zinc-50 dark:bg-zinc-800
                border border-zinc-200 dark:border-zinc-700
                text-zinc-900 dark:text-zinc-100
                placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                text-sm"
              required
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              账户名（可选）
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="邮箱或用户名"
              className="w-full px-3 py-2.5 rounded-xl
                bg-zinc-50 dark:bg-zinc-800
                border border-zinc-200 dark:border-zinc-700
                text-zinc-900 dark:text-zinc-100
                placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                text-sm"
            />
          </div>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              密钥（Secret） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(cleanSecret(e.target.value))}
              placeholder="Base32 格式，如 JBSWY3DPEHPK3PXP"
              className="w-full px-3 py-2.5 rounded-xl font-mono text-sm
                bg-zinc-50 dark:bg-zinc-800
                border border-zinc-200 dark:border-zinc-700
                text-zinc-900 dark:text-zinc-100
                placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              自动过滤空格和特殊字符，支持带空格或横杠的密钥
            </p>
            {secret && !isValidSecret && (
              <p className="mt-1 text-xs text-red-500">
                密钥至少需要 16 位有效字符
              </p>
            )}
          </div>

          {/* 高级选项 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                算法
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as "SHA1" | "SHA256" | "SHA512")}
                className="w-full px-3 py-2.5 rounded-xl
                  bg-zinc-50 dark:bg-zinc-800
                  border border-zinc-200 dark:border-zinc-700
                  text-zinc-900 dark:text-zinc-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                  text-sm"
              >
                <option value="SHA1">SHA1</option>
                <option value="SHA256">SHA256</option>
                <option value="SHA512">SHA512</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                位数
              </label>
              <select
                value={digits}
                onChange={(e) => setDigits(Number(e.target.value) as 6 | 8)}
                className="w-full px-3 py-2.5 rounded-xl
                  bg-zinc-50 dark:bg-zinc-800
                  border border-zinc-200 dark:border-zinc-700
                  text-zinc-900 dark:text-zinc-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                  text-sm"
              >
                <option value={6}>6 位</option>
                <option value={8}>8 位</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                周期
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value) as 30 | 60)}
                className="w-full px-3 py-2.5 rounded-xl
                  bg-zinc-50 dark:bg-zinc-800
                  border border-zinc-200 dark:border-zinc-700
                  text-zinc-900 dark:text-zinc-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                  text-sm"
              >
                <option value={30}>30 秒</option>
                <option value={60}>60 秒</option>
              </select>
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              标签（可选）
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="例如：工作、个人、交易所"
              className="w-full px-3 py-2.5 rounded-xl
                bg-zinc-50 dark:bg-zinc-800
                border border-zinc-200 dark:border-zinc-700
                text-zinc-900 dark:text-zinc-100
                placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                text-sm"
            />
          </div>

          {/* QR 码预览 */}
          {previewUri && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
              <div className="p-2 bg-white rounded-lg">
                <QRCodeSVG value={previewUri} size={80} level="M" />
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  QR 码预览
                </p>
                <p>添加后可用手机扫描导入</p>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <motion.button
            type="submit"
            disabled={!issuer || !isValidSecret}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700
              text-white font-medium text-sm
              transition-colors disabled:cursor-not-allowed"
          >
            <Plus size={18} weight="light" />
            {isEditMode ? "保存修改" : "添加"}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
