"use client"

// 使用 Web Crypto API 进行 AES-GCM 加密

const PBKDF2_ITERATIONS = 100000

// 从密码派生密钥
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

// 加密数据
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const key = await deriveKey(password, salt)
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  )

  // 组合 salt + iv + 密文
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  result.set(salt, 0)
  result.set(iv, salt.length)
  result.set(new Uint8Array(encrypted), salt.length + iv.length)

  // 转换为 base64
  return btoa(String.fromCharCode(...result))
}

// 解密数据
export async function decrypt(ciphertext: string, password: string): Promise<string> {
  const decoder = new TextDecoder()
  const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))

  const salt = data.slice(0, 16)
  const iv = data.slice(16, 28)
  const encrypted = data.slice(28)

  const key = await deriveKey(password, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  )

  return decoder.decode(decrypted)
}

// 检查是否已设置密码
export function hasPassword(): boolean {
  return localStorage.getItem("flashotp-encrypted") !== null
}

// 保存加密数据
export async function saveEncrypted(data: unknown, password: string): Promise<void> {
  const json = JSON.stringify(data)
  const encrypted = await encrypt(json, password)
  localStorage.setItem("flashotp-encrypted", encrypted)
}

// 读取并解密数据
export async function loadEncrypted<T>(password: string): Promise<T | null> {
  const encrypted = localStorage.getItem("flashotp-encrypted")
  if (!encrypted) return null

  try {
    const json = await decrypt(encrypted, password)
    return JSON.parse(json) as T
  } catch {
    throw new Error("密码错误或数据损坏")
  }
}

// 清除加密数据
export function clearEncrypted(): void {
  localStorage.removeItem("flashotp-encrypted")
}

// 迁移未加密数据到加密存储
export async function migrateToEncrypted(password: string): Promise<void> {
  const rawData = localStorage.getItem("temp-mfa-entries")
  if (!rawData) return

  await saveEncrypted(JSON.parse(rawData), password)
  localStorage.removeItem("temp-mfa-entries")
}

// 从加密存储导出到未加密（用于导出功能）
export async function exportFromEncrypted(password: string): Promise<unknown> {
  return loadEncrypted(password)
}
