# FlashOTP

一个临时 MFA 二维码管理器，即走即用，数据不离开浏览器。

## 🚀 预览

**https://flashotp.ebato.win/**

## ✨ 功能

### 导入

- **多格式支持** - Proton Authenticator、Google Authenticator、Microsoft Authenticator、Authy
- **URI 列表** - 直接粘贴 `otpauth://` URI 批量导入
- **扫码导入** - 使用摄像头扫描 QR 码（需要 HTTPS）
- **剪贴板粘贴** - Ctrl+V 快速导入

### 临时 MFA

- **手动添加** - 输入服务名称、密钥即可生成
- **实时验证码** - 显示当前 TOTP 验证码和下一验证码
- **自定义标签** - 给条目添加标签分类
- **一键清除** - 随时删除所有数据

### 导出

- **QR 码下载** - 单个或批量下载 PNG
- **多格式导出** - JSON、URI 列表、CSV
- **ZIP 打包** - 批量下载为压缩包

### 体验

- **深浅色主题** - 跟随系统或手动切换
- **搜索过滤** - 按名称、账户、标签搜索
- **网格/列表视图** - 切换显示模式
- **快捷键** - Ctrl+V 粘贴、Ctrl+K 扫码、Ctrl+N 添加
- **动画效果** - 流畅的按钮和卡片动画
- **PWA 支持** - 可安装到桌面

## 🛠️ 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **动画**: Framer Motion
- **QR 码**: qrcode.react
- **TOTP**: otpauth
- **扫码**: jsqr
- **部署**: Cloudflare Pages

## 📦 安装

```bash
# 克隆仓库
git clone https://github.com/Souitou-iop/FlashOTP.git
cd FlashOTP/mfa-manager

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 🚀 部署

### Cloudflare Pages

```bash
# 构建
npm run build

# 部署
npx wrangler pages deploy out --project-name your-project-name
```

### 其他平台

项目是纯静态导出，`out` 目录可部署到任何静态托管服务：
- Vercel
- Netlify
- GitHub Pages
- 任何支持静态文件的服务器

## 📁 项目结构

```
mfa-manager/
├── app/
│   ├── layout.tsx      # 根布局
│   ├── page.tsx        # 主页面
│   └── globals.css     # 全局样式
├── components/
│   ├── AddMfaModal.tsx # 添加/编辑模态框
│   ├── FileUploader.tsx # 文件上传
│   ├── QrCard.tsx      # QR 码卡片
│   ├── QrGrid.tsx      # QR 码网格
│   ├── QrScanner.tsx   # 扫码组件
│   ├── TempMfaPanel.tsx # 临时 MFA 面板
│   ├── ThemeToggle.tsx # 主题切换
│   └── ...
├── lib/
│   ├── parser.ts       # MFA 解析器
│   ├── categorizer.ts  # 分类器
│   ├── types.ts        # 类型定义
│   └── useLocalStorage.ts # 本地存储
└── public/
    ├── manifest.json   # PWA 配置
    ├── sw.js           # Service Worker
    └── icon.svg        # 图标
```

## 🔒 安全

- 所有数据存储在浏览器 localStorage
- 不上传任何数据到服务器
- 支持一键清除所有数据
- Service Worker 不缓存 MFA 数据

## 📝 License

MIT

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Phosphor Icons](https://phosphoricons.com/)
