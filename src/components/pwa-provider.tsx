"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

const log = (message: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[PWA] ${message}`, ...args);
  }
};

export default function PWAProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              log("Nueva version del service worker lista. Refresca para actualizar.");
            }
          });
        });
      } catch (error) {
        log("Fallo al registrar el service worker", error);
      }
    };

    register();
  }, []);

  return null;
}
