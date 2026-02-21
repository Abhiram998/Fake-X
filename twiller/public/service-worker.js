// Production Service Worker for Twiller Push Notifications
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || "New Tweet";
        const options = {
            body: data.body || "Something new happened on Twiller.",
            icon: data.icon || "/favicon.ico",
            badge: "/favicon.ico",
            tag: data.tag || "twiller-notification",
            renotify: true,
            vibrate: [200, 100, 200],
            data: {
                url: data.url || "/"
            },
            actions: [
                { action: "open", title: "View Tweet" },
                { action: "unsubscribe", title: "Unsubscribe" }
            ]
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
        console.error("Error receiving push notification:", err);
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "unsubscribe") {
        // Handle unsubscribe logic here (e.g., focus a specific page or just close)
        // For now, we'll just close and maybe open the profile
        const urlToOpen = "/profile";
        event.waitUntil(
            self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes(urlToOpen) && "focus" in client) {
                        return client.focus();
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
        );
        return;
    }

    const urlToOpen = event.notification.data.url || "/";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && "focus" in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
