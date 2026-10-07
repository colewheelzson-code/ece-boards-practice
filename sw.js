"use strict";

const BASE = "/ece-boards-practice/";
const CACHE = "ece-boards-shell-v2";
const SHELL = [
  BASE,
  BASE + "choose-exam/",
  BASE + "choose-exam/final-coaching/",
  BASE + "choose-exam/final-coaching/geas/",
  BASE + "choose-exam/final-coaching/geas/geas-fc/",
  BASE + "choose-exam/final-coaching/elecs/",
  BASE + "choose-exam/final-coaching/est/",
  BASE + "choose-exam/final-coaching/math/",
  BASE + "choose-exam/preboard-exam/",
  BASE + "choose-exam/preboard-exam/math/",
  BASE + "site-ui.js",
  BASE + "practice-progress.js",
  BASE + "choose-exam/theme.js",
  BASE + "choose-exam/folder-style.css?v=install-flow-1",
  BASE + "choose-exam/practice-theme.css?v=install-flow-1",
  BASE + "choose-exam/engineer-logo.png",
  BASE + "choose-exam/engineer-app-icon.svg",
  BASE + "manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("ece-boards-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const cacheKey = new Request(url.origin + url.pathname);
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === "basic") caches.open(CACHE).then(cache => cache.put(cacheKey, response.clone()));
    return response;
  }).catch(async () => {
    const cached = await caches.match(cacheKey);
    if (cached) return cached;
    if (request.mode === "navigate") return (await caches.match(BASE + "choose-exam/")) || Response.error();
    return Response.error();
  }));
});
