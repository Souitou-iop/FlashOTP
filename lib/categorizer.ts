import type { Category } from "./types"

const RULES: [RegExp, Category][] = [
  // 加密货币交易所
  [/\b(binance|bitget|okx|bybit|kraken|coinbase|huobi|gate\.?io|kucoin|bitfinex|bitstamp|gemini|crypto\.?com|ftx|deribit|mexc|bitmart|lbank|phemex|whitebit)\b/i, "crypto-exchange"],

  // 加密货币钱包
  [/\b(wallet|metamask|trust.?wallet|phantom|ledger|trezor|exodus|atomic|coinomi|rainbow|argent)\b/i, "crypto-wallet"],

  // 云服务
  [/\b(aws|amazon.?web.?services|google.?cloud|azure|digitalocean|cloudflare|vercel|netlify|heroku|linode|vultr|alibaba.?cloud|tencent.?cloud|huawei.?cloud)\b/i, "cloud"],

  // AI 服务
  [/\b(openai|anthropic|midjourney|copilot|hugging.?face|replicate|stability|perplexity|claude|chatgpt)\b/i, "ai"],

  // 社交 / 通讯
  [/\b(twitter|x\.com|discord|telegram|whatsapp|signal|slack|teams|zoom|reddit|instagram|facebook|tiktok|linkedin|mastodon|threads)\b/i, "social"],

  // 金融 / 支付
  [/\b(paypal|stripe|wise|revolut|monzo|chase|bank|visa|mastercard|amex|coinbase|robinhood|etrade|fidelity|schwab)\b/i, "finance"],

  // 邮箱
  [/\b(gmail|outlook|proton.?mail|yahoo|hotmail|icloud|fastmail|tutanota|zoho)\b/i, "email"],

  // 游戏
  [/\b(steam|epic|playstation|xbox|nintendo|riot|blizzard|ubisoft|ea|valve|twitch|battle\.net)\b/i, "gaming"],
]

export function categorize(name: string, issuer: string): Category {
  const text = `${name} ${issuer}`

  for (const [pattern, category] of RULES) {
    if (pattern.test(text)) {
      return category
    }
  }

  return "other"
}
