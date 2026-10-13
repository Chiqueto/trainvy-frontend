// Service Worker do Trainvy (PWA) — Hardening & Privacy-First Security
// Versão do cache: v2 (substitui e purga v1 legada para eliminar HTML autenticado em cache)
const CACHE_NAME = "trainvy-static-v2";

// ALLOWLIST RESTRITA: Somente recursos estáticos públicos e independentes de sessão.
// NUNCA incluir "/", "/profile", "/admin" ou qualquer rota HTML autenticada aqui!
const PRECACHE_ASSETS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/symbol.png",
  "/logo.png",
  "/apple-icon.png",
];

// Instalação: Pré-armazena exclusivamente os assets públicos essenciais da allowlist
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Ativação: Purga rigorosamente qualquer cache antigo do Trainvy (ex: trainvy-static-v1)
// Preserva caches de outras aplicações na mesma origem, afetando apenas chaves 'trainvy-'
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name.startsWith("trainvy-") && name !== CACHE_NAME) {
              console.log("[Service Worker] Purgando cache legado sensível:", name);
              return caches.delete(name);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Métodos mutáveis (POST, PUT, DELETE, PATCH, etc.) nunca passam por cache
  if (request.method !== "GET") {
    return;
  }

  // 2. Proteção rigorosa de APIs, gateway de backend, autenticação e Server Actions:
  // NUNCA interceptar ou armazenar em cache:
  // - /api/* (Better Auth, endpoints internos)
  // - /backend/* (Gateway proxy do backend Fastify)
  // - Requisições RSC / Flight (?_rsc=... ou header RSC)
  // - Requisições com header Next-Action
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/backend/") ||
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Action")
  ) {
    return;
  }

  // 3. Navegação (HTML pages): NETWORK-ONLY estrito para proteger dados privados de sessão.
  // Nenhuma página HTML autenticada (/ , /profile, /stats, /history, /planning, /admin) é cacheadas.
  // Em caso de falha de conexão (offline), retorna exclusivamente a tela genérica /offline.html
  // que NÃO contém nenhum dado da sessão anterior.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlinePage = await caches.match("/offline.html");
        return (
          offlinePage ||
          new Response("Você está offline. Conecte-se para continuar.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // 4. Allowlist restritiva para assets estáticos versionados e públicos:
  // - Bundles estáticos versionados do Next.js (/_next/static/*)
  // - Imagens estáticas públicas de exercícios (/exercise-media/repdb/*)
  // - Ícones e assets pré-cacheados
  // - Fontes estáticas (.woff2)
  const isStaticNextAsset = url.pathname.startsWith("/_next/static/");
  const isExerciseMedia = url.pathname.startsWith("/exercise-media/repdb/");
  const isPrecachedAsset = PRECACHE_ASSETS.includes(url.pathname);
  const isFont = url.pathname.endsWith(".woff2");

  if (isStaticNextAsset || isExerciseMedia || isPrecachedAsset || isFont) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // Se for imagem e falhar offline, deixa o fallback do componente tratar
          return new Response(null, { status: 404, statusText: "Offline Not Found" });
        }
      }),
    );
  }
});
