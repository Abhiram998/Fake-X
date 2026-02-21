import toast from "react-hot-toast";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import axiosInstance from "./axiosInstance";

/**
 * Utility service for handling Hybrid Notifications
 * (Native Browser Notifications for Desktop, Tweet-style toasts for fallback/mobile)
 */

export const keywords = ["cricket", "science"];

export const checkNotificationPermission = (): NotificationPermission => {
    if (typeof window === "undefined" || !("Notification" in window)) {
        return "denied";
    }
    return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
};

/**
 * Detects if the current device is mobile based on user agent
 */
const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const showNotification = async (tweet: any) => {
    if (!tweet) return;

    const title = `${tweet.author?.displayName || "New Tweet"} tweeted`;
    const body = tweet.content;

    console.log("🔔 Triggering real native notification:", title);

    const nativeSupported = typeof window !== "undefined" && "Notification" in window;
    const permission = checkNotificationPermission();

    if (nativeSupported && permission === "granted") {
        const options: any = {
            body,
            icon: tweet.author?.avatar || "/favicon.ico",
            badge: "/favicon.ico",
            tag: `tweet-${tweet._id}`,
            vibrate: [200, 100, 200],
            renotify: true,
            silent: false,
            data: {
                url: "/",
                tweetId: tweet._id
            }
        };

        try {
            // Priority 1: Service Worker (Best for mobile and background)
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration && "showNotification" in registration) {
                    await registration.showNotification(title, options);
                    return;
                }
            }
            // Priority 2: Native Notification API (Laptop fallback)
            new Notification(title, options);
        } catch (error) {
            console.error("❌ Failed to show native notification:", error);
        }
    } else {
        console.warn("⚠️ Cannot show native notification: Permission denied or not supported.");
    }
};

export const shouldNotifyForTweet = (content: string): boolean => {
    if (!content) return false;
    const lowercaseContent = content.toLowerCase();
    return keywords.some((keyword) => lowercaseContent.includes(keyword.toLowerCase()));
};

// Use localStorage to track notified tweets across refreshes to prevent duplicates
const getNotifiedTweets = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem("notified_tweets");
    return saved ? new Set(JSON.parse(saved)) : new Set();
};

const saveNotifiedTweet = (id: string) => {
    if (typeof window === "undefined") return;
    const notified = getNotifiedTweets();
    notified.add(id);
    // Keep only last 50 to avoid massive localstorage
    const limited = Array.from(notified).slice(-50);
    localStorage.setItem("notified_tweets", JSON.stringify(limited));
};

export const triggerTweetNotification = (tweet: any) => {
    if (!tweet?._id) return;

    const notified = getNotifiedTweets();
    if (notified.has(tweet._id)) return;

    if (shouldNotifyForTweet(tweet.content)) {
        showNotification(tweet);
        saveNotifiedTweet(tweet._id);
    }
};

/**
 * PRODUCTION WEB PUSH LOGIC
 */

const VAPID_PUBLIC_KEY = "BFtpjv5AmyMEoYgs-RN_uLelroymI5vtWVmCkm3WdFAyVXRSCSgsQklu8mY-Pfo-hVZZz86dRgbiTK3BmZGjQZY";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeUserToPush = async (userId: string) => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Push messaging is not supported");
        return;
    }

    try {
        // Wait for SW to be ready
        const registration = await navigator.serviceWorker.ready;

        // Try getting existing subscription first
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
        }

        console.log("✅ Push Subscription active:", subscription);

        // Send to backend
        await axiosInstance.post("/subscribe", {
            userId,
            subscription,
        });

        return subscription;
    } catch (error: any) {
        console.error("❌ Failed to subscribe user to push:", error);
        let msg = error.message || "Failed to subscribe to push notifications.";
        if (msg.includes("permission")) msg = "Please allow notification permissions in your browser settings.";
        throw new Error(msg);
    }
};

export const unsubscribeUserFromPush = async (userId: string) => {
    if (!("serviceWorker" in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();

            // Remove from backend
            await axiosInstance.post("/unsubscribe", {
                userId,
                endpoint
            });

            console.log("✅ Unsubscribed from push");
        }
    } catch (error) {
        console.error("❌ Failed to unsubscribe from push:", error);
    }
};
