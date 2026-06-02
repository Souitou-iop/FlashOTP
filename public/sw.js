const CACHE_NAME = "flashotp-v2"
const STATIC_ASSETS = ["/", "/manifest.json", "/icon-192.svg"]

// 安装 - 预缓存静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] 预缓存静态资源")
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// 激活 - 清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] 清理旧缓存:", key)
            return caches.delete(key)
          })
      )
    )
  )
  self.clients.claim()
})

// 请求拦截 - 混合策略
self.addEventListener("fetch", (event) => {
  // 只处理 GET 请求
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)

  // 静态资源 - Cache First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
      })
    )
    return
  }

  // API 请求 - Network Only
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request))
    return
  }

  // 页面请求 - Network First with fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功获取则更新缓存
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // 网络失败则使用缓存
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          // 如果没有缓存，返回离线页面
          return caches.match("/")
        })
      })
  )
})

// 监听消息 - 手动缓存更新
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting()
  }
})
