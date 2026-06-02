export interface MfaEntry {
  id: string
  content: {
    uri: string
    entry_type: string
    name: string
  }
  note: string | null
}

export interface MfaBackup {
  version: number
  entries: MfaEntry[]
}

export interface ParsedOtp {
  type: "totp" | "hotp"
  label: string
  secret: string
  issuer: string
  algorithm: string
  digits: number
  period: number
}

export interface CategorizedEntry {
  id: string
  name: string
  issuer: string
  uri: string
  parsed: ParsedOtp
  category: Category
}

export type Category =
  | "crypto-exchange"
  | "crypto-wallet"
  | "cloud"
  | "ai"
  | "social"
  | "finance"
  | "email"
  | "gaming"
  | "other"

export interface CategoryInfo {
  id: Category
  label: string
  icon: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: "crypto-exchange", label: "加密货币交易所", icon: "ChartLineUp" },
  { id: "crypto-wallet", label: "加密货币钱包", icon: "Wallet" },
  { id: "cloud", label: "云服务", icon: "Cloud" },
  { id: "ai", label: "AI 服务", icon: "Robot" },
  { id: "social", label: "社交 / 通讯", icon: "ChatCircle" },
  { id: "finance", label: "金融 / 支付", icon: "CreditCard" },
  { id: "email", label: "邮箱", icon: "Envelope" },
  { id: "gaming", label: "游戏", icon: "GameController" },
  { id: "other", label: "其他", icon: "DotsSix" },
]

// 临时 MFA 条目（手动添加）
export interface TempMfaEntry {
  id: string
  issuer: string
  name: string
  secret: string
  algorithm: "SHA1" | "SHA256" | "SHA512"
  digits: 6 | 8
  period: 30 | 60
  createdAt: number
}

// 将 TempMfaEntry 转换为 CategorizedEntry
export function toCategorizedEntry(entry: TempMfaEntry): CategorizedEntry {
  const uri = `otpauth://totp/${encodeURIComponent(entry.issuer)}${entry.name ? ":" + encodeURIComponent(entry.name) : ""}?secret=${entry.secret}&issuer=${encodeURIComponent(entry.issuer)}&algorithm=${entry.algorithm}&digits=${entry.digits}&period=${entry.period}`
  return {
    id: entry.id,
    name: entry.name || entry.issuer,
    issuer: entry.issuer,
    uri,
    parsed: {
      type: "totp",
      label: entry.name || entry.issuer,
      secret: entry.secret,
      issuer: entry.issuer,
      algorithm: entry.algorithm,
      digits: entry.digits,
      period: entry.period,
    },
    category: "other",
  }
}
