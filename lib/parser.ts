import type { MfaBackup, ParsedOtp } from "./types"

export function parseMfaJson(text: string): MfaBackup {
  const data = JSON.parse(text)

  if (!data.version || !Array.isArray(data.entries)) {
    throw new Error("无效的 MFA 备份文件格式")
  }

  return data as MfaBackup
}

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
