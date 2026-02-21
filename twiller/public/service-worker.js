// Production Service Worker for Twiller Push Notifications
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
    if (!event.data) return;

    const promiseChain = self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
    }).then((windowClients) => {
        let isFocused = false;
        for (let i = 0; i < windowClients.length; i++) {
            if (windowClients[i].focused) {
                isFocused = true;
                break;
            }
        }

        // If user is actively using the app, don't show system notification
        // to prevent double notifications (app will show toast/socket alert)
        if (isFocused) {
            console.log("Tab is focused, skipping system notification");
            return;
        }

        try {
            const data = event.data.json();
            const title = data.title || "New Tweet Alert";
            const options = {
                body: data.body || "Something new happened on Twiller.",
                icon: data.icon || "/favicon.ico",
                badge: "/favicon.ico",
                tag: "twiller-notification",
                renotify: true,
                vibrate: [200, 100, 200],
                data: {
                    url: data.url || "/"
                },
                actions: [
                    { action: "open", title: "View Tweet" }
                ]
            };

            return self.registration.showNotification(title, options);
        } catch (e) {
            console.error("Error parsing push data:", e);
        }
    });

    event.waitUntil(promiseChain);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url || "/";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window open and focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && "focus" in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
