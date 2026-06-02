import type { MfaBackup, ParsedOtp } from "./types"

// 解析 otpauth URI
export function parseOtpUri(uri: string): ParsedOtp {
  try {
    const url = new URL(uri)

    if (url.protocol !== "otpauth:") {
      throw new Error("非 otpauth 协议")
    }

    const type = url.hostname as "totp" | "hotp"
    const label = decodeURIComponent(url.pathname.replace(/^\//, ""))
    const params = url.searchParams

    return {
      type,
      label,
      secret: params.get("secret") || "",
      issuer: params.get("issuer") || label.split(":")[0] || "",
      algorithm: params.get("algorithm") || "SHA1",
      digits: parseInt(params.get("digits") || "6", 10),
      period: parseInt(params.get("period") || "30", 10),
    }
  } catch {
    return {
      type: "totp",
      label: uri,
      secret: "",
      issuer: "",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    }
  }
}

// 从 otpauth URI 构建 MfaBackup
function buildBackupFromUris(uris: string[]): MfaBackup {
  return {
    version: 1,
    entries: uris.map((uri, i) => {
      const parsed = parseOtpUri(uri)
      return {
        id: `imported-${i}-${Date.now()}`,
        content: {
          uri,
          entry_type: parsed.type === "totp" ? "Totp" : "Hotp",
          name: parsed.label,
        },
        note: null,
      }
    }),
  }
}

// Proton Authenticator 格式
function parseProtonAuthenticator(data: unknown): MfaBackup | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "version" in data &&
    "entries" in data &&
    Array.isArray((data as MfaBackup).entries)
  ) {
    return data as MfaBackup
  }
  return null
}

// Google Authenticator 格式（导出的 JSON 数组）
function parseGoogleAuthenticator(data: unknown): MfaBackup | null {
  if (!Array.isArray(data)) return null

  const entries = data
    .filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "secret" in item &&
        "issuer" in item
    )
    .map((item: Record<string, unknown>, i) => {
      const secret = String(item.secret || "")
      const issuer = String(item.issuer || "")
      const name = String(item.name || item.account || "")
      const algorithm = String(item.algorithm || "SHA1").toUpperCase()
      const digits = Number(item.digits || 6)
      const period = Number(item.period || 30)
      const type = String(item.type || "totp").toLowerCase()

      const uri = `otpauth://${type}/${encodeURIComponent(issuer)}${name ? ":" + encodeURIComponent(name) : ""}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}&period=${period}`

      return {
        id: `google-${i}-${Date.now()}`,
        content: {
          uri,
          entry_type: type === "totp" ? "Totp" : "Hotp",
          name: name || issuer,
        },
        note: null,
      }
    })

  if (entries.length === 0) return null
  return { version: 1, entries }
}

// Microsoft Authenticator 格式
function parseMicrosoftAuthenticator(data: unknown): MfaBackup | null {
  if (typeof data !== "object" || data === null) return null

  const obj = data as Record<string, unknown>

  // Microsoft Authenticator 使用 "accounts" 或 "AuthenticationBuffer"
  const accounts = obj.accounts || obj.AuthenticationBuffer
  if (!Array.isArray(accounts)) return null

  const entries = accounts
    .filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        ("secret" in item || "SecretKey" in item)
    )
    .map((item: Record<string, unknown>, i) => {
      const secret = String(item.secret || item.SecretKey || "")
      const issuer = String(
        item.issuer || item.Issuer || item.Organization || ""
      )
      const name = String(
        item.name || item.Username || item.account || ""
      )
      const algorithm = String(
        item.algorithm || item.Algorithm || "SHA1"
      ).toUpperCase()
      const digits = Number(item.digits || item.Digits || 6)
      const period = Number(item.period || item.Period || 30)

      const uri = `otpauth://totp/${encodeURIComponent(issuer)}${name ? ":" + encodeURIComponent(name) : ""}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}&period=${period}`

      return {
        id: `ms-${i}-${Date.now()}`,
        content: {
          uri,
          entry_type: "Totp",
          name: name || issuer,
        },
        note: null,
      }
    })

  if (entries.length === 0) return null
  return { version: 1, entries }
}

// Authy 格式
function parseAuthy(data: unknown): MfaBackup | null {
  if (typeof data !== "object" || data === null) return null

  const obj = data as Record<string, unknown>

  // Authy 可能使用 "authenticator_tokens" 或 "accounts"
  const tokens = obj.authenticator_tokens || obj.accounts || obj.tokens
  if (!Array.isArray(tokens)) return null

  const entries = tokens
    .filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        ("secret" in item || "encryptedSecret" in item)
    )
    .map((item: Record<string, unknown>, i) => {
      const secret = String(item.secret || item.encryptedSecret || "")
      const issuer = String(item.issuer || item.name || "")
      const name = String(item.accountType || item.phone || "")
      const algorithm = String(item.algorithm || "SHA1").toUpperCase()
      const digits = Number(item.digits || 6)
      const period = Number(item.period || 30)

      const uri = `otpauth://totp/${encodeURIComponent(issuer)}${name ? ":" + encodeURIComponent(name) : ""}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}&period=${period}`

      return {
        id: `authy-${i}-${Date.now()}`,
        content: {
          uri,
          entry_type: "Totp",
          name: name || issuer,
        },
        note: null,
      }
    })

  if (entries.length === 0) return null
  return { version: 1, entries }
}

// otpauth:// URI 列表格式（每行一个 URI）
function parseUrisText(text: string): MfaBackup | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("otpauth://"))

  if (lines.length === 0) return null
  return buildBackupFromUris(lines)
}

// Google Authenticator 迁移格式 (otpauth-migration://)
function parseMigrationUri(text: string): MfaBackup | null {
  // Google Authenticator 导出的迁移 URI
  const migrationLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("otpauth-migration://"))

  if (migrationLines.length === 0) return null

  // 这种格式需要 protobuf 解析，暂时提示用户使用其他方式
  // 先返回 null，让主解析逻辑继续尝试其他格式
  return null
}

// 自动检测格式并解析
export function parseMfaJson(text: string): MfaBackup {
  // 1. 尝试解析为 JSON
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    // 不是 JSON，尝试作为 URI 列表
    const uriBackup = parseUrisText(text)
    if (uriBackup && uriBackup.entries.length > 0) {
      return uriBackup
    }

    // 尝试迁移格式
    const migrationBackup = parseMigrationUri(text)
    if (migrationBackup) {
      return migrationBackup
    }

    throw new Error("无法识别的文件格式。支持 Proton Authenticator、Google Authenticator、Microsoft Authenticator、Authy 或 otpauth:// URI 列表")
  }

  // 2. 按优先级尝试各种格式

  // Proton Authenticator
  const proton = parseProtonAuthenticator(data)
  if (proton) return proton

  // Google Authenticator
  const google = parseGoogleAuthenticator(data)
  if (google) return google

  // Microsoft Authenticator
  const ms = parseMicrosoftAuthenticator(data)
  if (ms) return ms

  // Authy
  const authy = parseAuthy(data)
  if (authy) return authy

  throw new Error("无法识别的 JSON 格式。支持 Proton Authenticator、Google Authenticator、Microsoft Authenticator、Authy")
}
