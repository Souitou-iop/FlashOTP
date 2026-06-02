"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, X, Scan } from "@phosphor-icons/react"
import jsQR from "jsqr"

interface QrScannerProps {
  onScan: (uri: string) => void
  onClose: () => void
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const animationRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  // 扫描 QR 码
  const scanFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code && code.data.startsWith("otpauth://")) {
        stopCamera()
        onScan(code.data)
        return
      }
    }

    animationRef.current = requestAnimationFrame(scanFrame)
  }, [onScan, stopCamera])

  // 启动摄像头
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setScanning(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        animationRef.current = requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      console.error("摄像头错误:", err)
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("请允许访问摄像头权限")
        } else if (err.name === "NotFoundError") {
          setError("未找到摄像头设备")
        } else {
          setError(`摄像头错误: ${err.message}`)
        }
      } else {
        setError("启动摄像头失败")
      }
      setScanning(false)
    }
  }, [scanFrame])

  // 组件挂载时启动摄像头
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-lg mx-4">
        {/* 关闭按钮 */}
        <button
          onClick={() => {
            stopCamera()
            onClose()
          }}
          className="absolute -top-12 right-0 p-2 text-white hover:text-zinc-300"
        >
          <X size={24} weight="light" />
        </button>

        {/* 视频区域 */}
        <div className="relative rounded-2xl overflow-hidden bg-black">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 text-white">
              <Camera size={48} weight="light" className="mb-4 text-zinc-400" />
              <p className="text-sm text-zinc-300 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
              >
                重试
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-auto"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* 扫描框 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-emerald-500 rounded-2xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
                </div>
              </div>

              {/* 扫描提示 */}
              {scanning && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-sm text-white/80">
                    将 QR 码放入框内自动扫描
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
