"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { hasPassword, saveEncrypted, loadEncrypted } from "./crypto"

export function useEncryptedStorage<T>(initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)
  const passwordRef = useRef<string | null>(null)

  // 设置密码并加载数据
  const unlock = useCallback(async (password: string) => {
    passwordRef.current = password

    try {
      if (hasPassword()) {
        const data = await loadEncrypted<T>(password)
        if (data) {
          setStoredValue(data)
        }
      }
    } catch (e) {
      console.error("解密失败:", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // 写入加密存储
  const setValue = useCallback(
    async (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (passwordRef.current) {
        try {
          await saveEncrypted(valueToStore, passwordRef.current)
        } catch (e) {
          console.error("加密保存失败:", e)
        }
      }
    },
    [storedValue]
  )

  // 清除
  const removeValue = useCallback(async () => {
    setStoredValue(initialValue)
    if (passwordRef.current) {
      try {
        await saveEncrypted(initialValue, passwordRef.current)
      } catch (e) {
        console.error("清除失败:", e)
      }
    }
  }, [initialValue])

  // 检查是否需要密码
  const needsPassword = hasPassword()

  return {
    storedValue,
    setValue,
    removeValue,
    isLoaded,
    unlock,
    needsPassword,
    isUnlocked: passwordRef.current !== null,
  }
}
