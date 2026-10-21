const CACHE_NAME = "talentry-v3";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./app.html",
    "./manifest.json",
    "./css/style.css",
    "./css/app.css",
    "./css/pages.css",
    "./js/script.js",
    "./js/pages.js",
    "./js/app.js",
    "./js/firebase-config.js",
    "./paginas/como-funciona.html",
    "./paginas/oportunidades.html",
    "./paginas/beneficios.html",
    "./paginas/talento.html",
    "./paginas/empresas.html",
    "./paginas/innovacion.html",
    "./paginas/contacto.html",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS))
    );
    self.skipWaiting();
});

// Borra los cachés de versiones anteriores al activar la nueva versión.
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((nombres) => Promise.all(
                nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Solo archivos propios con GET; Firebase y demás servicios externos pasan directo
    if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

    // Primero red (siempre ves lo último), y si no hay internet, usa el caché
    event.respondWith(
        fetch(event.request)
            .then((respuesta) => {
                const copia = respuesta.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
                return respuesta;
            })
            .catch(() => caches.match(event.request))
    );
});
