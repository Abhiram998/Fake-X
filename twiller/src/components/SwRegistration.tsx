"use client";

import { useEffect } from "react";

export default function SwRegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            const register = async () => {
                try {
                    const registration = await navigator.serviceWorker.register("/service-worker.js");
                    console.log("✅ SW registered:", registration.scope);
                } catch (error) {
                    console.error("❌ SW registration failed:", error);
                }
            };

            if (document.readyState === "complete") {
                register();
            } else {
                window.addEventListener("load", register);
                return () => window.removeEventListener("load", register);
            }
        }
    }, []);

    return null;
}
