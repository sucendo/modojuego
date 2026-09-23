/*
* chatbotLoader.js — carga ordenada desde configuración central
*/

(function () {
  if (window.__CHATBOT_LOADER_ACTIVE__) return;
  window.__CHATBOT_LOADER_ACTIVE__ = true;

  const LOADED = (window.__CHATBOT_LOADED__ = window.__CHATBOT_LOADED__ || new Set());

  const currentScript =
    document.currentScript ||
    (function () {
      const s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();

  // Base del proyecto: .../assets/js/core/chatbotLoader.js -> /
  const ROOT = currentScript
    ? currentScript.src.split("?")[0].replace(/assets\/js\/core\/[^/]+$/, "")
    : "./";
  window.__CHATBOT_ROOT__ = ROOT;

  function resolveProjectPath(relPath) {
    if (!relPath) return ROOT;
    if (/^https?:\/\//i.test(relPath)) return relPath;
    return new URL(relPath.replace(/^\.\//, ""), ROOT).href;
  }

  function alreadyLoaded(url) {
    if (LOADED.has(url)) return true;
    const scripts = document.querySelectorAll("script[src]");
    for (const s of scripts) {
      if (s.src.split("?")[0] === url.split("?")[0]) return true;
    }
    return false;
  }

  function loadScriptOnce(url, { timeout = 15000 } = {}) {
    return new Promise((resolve, reject) => {
      if (alreadyLoaded(url)) {
        LOADED.add(url);
        return resolve("cached");
      }

      const s = document.createElement("script");
      s.defer = true;
      s.src = url;

      const t = setTimeout(() => {
        s.onerror = s.onload = null;
        reject(new Error("Timeout cargando " + url));
      }, timeout);

      s.onload = () => {
        clearTimeout(t);
        LOADED.add(url);
        resolve("loaded");
      };
      s.onerror = () => {
        clearTimeout(t);
        reject(new Error("Error cargando " + url));
      };

      document.head.appendChild(s);
    });
  }

  function domReady() {
    if (document.readyState === "loading") {
      return new Promise((res) => document.addEventListener("DOMContentLoaded", res, { once: true }));
    }
    return Promise.resolve();
  }

  async function bootstrapIfAvailable() {
    for (const name of ["inicializarChatbot", "initChatbot", "bootstrapChatbot", "setupChatbot"]) {
      const fn = window[name];
      if (typeof fn === "function") {
        try {
          await fn();
          return true;
        } catch (e) {
          console.warn(`[ChatbotLoader] Falló ${name}():`, e);
        }
      }
    }
    return false;
  }

  (async () => {
    await domReady();

    const cfg = window.ChatmuConfig || {};
    const moduleBase = cfg.modules?.base || "assets/js/";

    const utilFirst = resolveProjectPath(moduleBase + "modules/chatbotUtilidades.js");
    await loadScriptOnce(utilFirst);

    for (const rel of cfg.modules?.core || []) {
      await loadScriptOnce(resolveProjectPath(moduleBase + rel));
    }

    for (const rel of cfg.modules?.optional || []) {
      try {
        if (/modules\/chatbotUtilidades\.js$/i.test(rel)) continue; // ya cargado
        await loadScriptOnce(resolveProjectPath(moduleBase + rel));
      } catch (e) {
        console.warn(`[ChatbotLoader] Módulo opcional no cargado: ${rel}`, e);
      }
    }

    const started = await bootstrapIfAvailable();
    console.info(
      `[ChatbotLoader] Root="${ROOT}" · módulos cargados: ${Array.from(LOADED).map((u) => u.split("/").pop()).join(", ")}${started ? " · arrancado" : ""}`
    );
  })().catch((e) => {
    console.error("[ChatbotLoader] Error fatal durante la carga:", e);
  });
})();
