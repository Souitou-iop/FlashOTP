"use client"

import { useState, useCallback, useEffect } from "react"
import { Lock, Key, Eye, EyeSlash, ShieldCheck } from "@phosphor-icons/react"
import { hasPassword, saveEncrypted, loadEncrypted, migrateToEncrypted } from "@/lib/crypto"

interface PasswordGateProps {
  onUnlock: (password: string) => void
  children: React.ReactNode
}

export function PasswordGate({ onUnlock, children }: PasswordGateProps) {
  const [isSet, setIsSet] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsSet(hasPassword())
  }, [])

  // 设置新密码
  const handleSetPassword = useCallback(async () => {
    if (password.length < 6) {
      setError("密码至少需要 6 位")
      return
    }
    if (password !== confirmPassword) {
      setError("两次密码不一致")
      return
    }

    setLoading(true)
    setError("")

    try {
      // 迁移现有数据
      await migrateToEncrypted(password)
      setIsSet(true)
      onUnlock(password)
    } catch (err) {
      setError("设置密码失败")
    } finally {
      setLoading(false)
    }
  }, [password, confirmPassword, onUnlock])

  // 验证密码
  const handleUnlock = useCallback(async () => {
    if (!password) {
      setError("请输入密码")
      return
    }

    setLoading(true)
    setError("")

    try {
      await loadEncrypted(password)
      onUnlock(password)
    } catch (err) {
      setError("密码错误")
    } finally {
      setLoading(false)
    }
  }, [password, onUnlock])

  // 加载中
  if (isSet === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-zinc-400">加载中...</div>
      </div>
    )
  }

  // 已解锁
  if (isSet === false) {
    // 没有设置密码，显示设置界面
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm space-y-6 p-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ShieldCheck size={32} weight="light" className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
              设置安全密码
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              密码将加密保护你的 MFA 数据
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置密码（至少 6 位）"
                className="w-full px-4 py-3 rounded-xl pr-10
                  bg-zinc-100 dark:bg-zinc-800
                  border border-zinc-200 dark:border-zinc-700
                  text-zinc-900 dark:text-zinc-100
                  placeholder:text-zinc-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                  text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认密码"
              className="w-full px-4 py-3 rounded-xl
                bg-zinc-100 dark:bg-zinc-800
                border border-zinc-200 dark:border-zinc-700
                text-zinc-900 dark:text-zinc-100
                placeholder:text-zinc-400
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
            />

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <button
              onClick={handleSetPassword}
              disabled={loading}
              className="w-full py-3 rounded-xl
                bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700
                text-white font-medium text-sm
                transition-colors"
            >
              {loading ? "设置中..." : "设置密码并加密"}
            </button>
          </div>

          <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
            忘记密码将无法恢复数据
          </p>
        </div>
      </div>
    )
  }

  // 已设置密码，显示解锁界面
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Lock size={32} weight="light" className="text-zinc-400" />
          </div>
          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
            输入密码解锁
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            你的 MFA 数据已加密保护
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              className="w-full px-4 py-3 rounded-xl pr-10
                bg-zinc-100 dark:bg-zinc-800
                border border-zinc-200 dark:border-zinc-700
                text-zinc-900 dark:text-zinc-100
                placeholder:text-zinc-400
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              autoFocus
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full py-3 rounded-xl
              bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700
              text-white font-medium text-sm
              transition-colors"
          >
            {loading ? "验证中..." : "解锁"}
          </button>
        </div>
      </div>
    </div>
  )
}
