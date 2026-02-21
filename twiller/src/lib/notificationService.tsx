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

    const title = "New Tweet Alert";
    const body = tweet.content;

    console.log("🔔 Notification triggered:", title);

    const nativeSupported = typeof window !== "undefined" && "Notification" in window;
    const isMobile = isMobileDevice();
    const permission = checkNotificationPermission();

    // SYSTEM NOTIFICATION LOGIC (Desktop Native)
    if (!isMobile && nativeSupported && permission === "granted") {
        const options = {
            body,
            icon: tweet.author?.avatar || "/favicon.ico",
            badge: "/favicon.ico",
            tag: "tweet-alert",
            vibrate: [200, 100, 200],
            renotify: true,
            requireInteraction: false,
        };

        try {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration && "showNotification" in registration) {
                    await registration.showNotification(title, options);
                    return;
                }
            }
            new Notification(title, options);
            return; // Success with native
        } catch (error) {
            console.error("❌ Native notification failed, falling back to toast:", error);
        }
    }

    // TWEET-STYLE TOAST FALLBACK (Mobile or Permission Denied)
    toast.custom((t) => (
        <div
            className={`${t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'} 
            pointer-events-auto flex items-start w-full max-w-sm bg-black border border-gray-800 rounded-2xl p-4 shadow-2xl ring-1 ring-white/10`}
            onClick={() => toast.dismiss(t.id)}
        >
            <div className="flex-shrink-0 mr-3">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-800">
                    <img src={tweet.author?.avatar} alt="" className="h-full w-full object-cover" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">New Tweet Alert</span>
                    <span className="text-[10px] text-gray-500">@{tweet.author?.username}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-white truncate">{tweet.author?.displayName}</p>
                </div>
                <p className="text-sm text-gray-200 mt-0.5 leading-normal">
                    {tweet.content}
                </p>
            </div>
            <div className="ml-2 flex-shrink-0 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </div>
        </div>
    ), {
        duration: 5000,
        position: "top-center",
    });
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
