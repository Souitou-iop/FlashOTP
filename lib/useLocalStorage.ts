"use client"

import { useState, useEffect, useCallback } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // 从 localStorage 读取
  useEffect(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (e) {
      console.error(`读取 localStorage 失败 (${key}):`, e)
    } finally {
      setIsLoaded(true)
    }
  }, [key])

  // 写入 localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (e) {
        console.error(`写入 localStorage 失败 (${key}):`, e)
      }
    },
    [key, storedValue]
  )

  // 清除
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (e) {
      console.error(`清除 localStorage 失败 (${key}):`, e)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue, isLoaded] as const
}
