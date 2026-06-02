"use client"

import { ShieldCheck } from "@phosphor-icons/react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldCheck
        size={64}
        weight="light"
        className="text-zinc-300 dark:text-zinc-600 mb-6"
      />
      <h2 className="text-xl font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        导入你的 MFA 备份
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
        上传 Proton Authenticator 导出的 JSON 文件，自动生成可下载的 QR
        码并按服务分类整理。
      </p>
    </div>
  )
}
