"use client"

import { Warning } from "@phosphor-icons/react"

export function SecurityWarning() {
  return (
    <div
      className="flex gap-3 p-3 rounded-xl
        bg-amber-50 dark:bg-amber-950/20
        border border-amber-200 dark:border-amber-800/40"
    >
      <Warning
        size={20}
        weight="light"
        className="shrink-0 text-amber-500 mt-0.5"
      />
      <div className="text-sm text-amber-800 dark:text-amber-200/80 space-y-1">
        <p className="font-medium">安全提示</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-700 dark:text-amber-300/70">
          <li>所有处理均在浏览器本地完成，数据不会上传到任何服务器</li>
          <li>导入完成后请立即删除 QR 码图片和备份文件</li>
          <li>不要将 QR 码分享给任何人</li>
          <li>建议在离线环境下操作</li>
        </ul>
      </div>
    </div>
  )
}
