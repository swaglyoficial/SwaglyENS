"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

const log = (message: string, ...args: unknown[]) => {
  console.info(`[PWA] ${message}`, ...args);
};

export default function PWAProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      log("Service Worker no está disponible en este navegador");
      return;
    }

    const register = async () => {
      try {
        // Registrar service worker en desarrollo y producción
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });

        log("Service Worker registrado exitosamente", registration);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          log("Nueva versión del service worker encontrada");

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              log("Nueva versión del service worker lista. Refresca para actualizar.");
              // Opcional: Mostrar notificación al usuario
              if (window.confirm("Nueva versión disponible. ¿Quieres actualizar?")) {
                window.location.reload();
              }
            }
          });
        });

        // Verificar actualizaciones cada 60 segundos
        setInterval(() => {
          registration.update();
        }, 60000);

      } catch (error) {
        log("Fallo al registrar el service worker", error);
      }
    };

    register();

    // Agregar event listener para el evento beforeinstallprompt
    let deferredPrompt: any;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      log("PWA puede ser instalada. Guardando prompt para después.");

      // Puedes disparar un evento personalizado aquí para mostrar un botón de instalación
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar cuando la app fue instalada
    window.addEventListener('appinstalled', () => {
      log('PWA instalada exitosamente');
      deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
