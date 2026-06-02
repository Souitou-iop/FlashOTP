"use client"

import { useCallback, useState } from "react"
import { Upload, FileDashed } from "@phosphor-icons/react"

interface FileUploaderProps {
  onFileLoad: (content: string) => void
}

export function FileUploader({ onFileLoad }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text === "string") {
          onFileLoad(text)
        }
      }
      reader.readAsText(file)
    },
    [onFileLoad]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-3
        w-full max-w-xl mx-auto p-8 rounded-2xl
        border-2 border-dashed transition-all duration-200 cursor-pointer
        ${
          dragging
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        }
      `}
    >
      <input
        type="file"
        accept=".json,.json.txt,.txt"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      {dragging ? (
        <FileDashed size={48} className="text-emerald-500" weight="light" />
      ) : (
        <Upload
          size={48}
          className="text-zinc-400 dark:text-zinc-500"
          weight="light"
        />
      )}

      <div className="text-center">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
          {dragging ? "松开以导入" : "拖拽 MFA 备份文件到这里"}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          支持 Proton、Google、Microsoft Authenticator 或 URI 列表
        </p>
      </div>
    </div>
  )
}
