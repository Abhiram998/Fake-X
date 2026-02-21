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
            // Try Service Worker first but don't hang if it's not ready
            if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                const registration = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000))
                ]) as ServiceWorkerRegistration;

                if (registration && "showNotification" in registration) {
                    await registration.showNotification(title, options);
                    return;
                }
            }
            // Fallback to standard Notification API
            new Notification(title, options);
            return;
        } catch (error) {
            console.warn("⚠️ Native notification via SW failed/timed out, using fallback API:", error);
            try {
                new Notification(title, options);
                return;
            } catch (innerError) {
                console.error("❌ Both native notification methods failed:", innerError);
            }
        }
    }

    // TWEET-STYLE TOAST FALLBACK (Mobile or Permission Denied)
    toast.custom((t) => (
        <div
            className={`${t.visible ? 'animate-in fade-in slide-in-from-right-10 duration-500' : 'animate-out fade-out slide-out-to-right-10 duration-300'} 
            pointer-events-auto flex items-start w-[320px] bg-[#1a1c1e]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5`}
            onClick={() => toast.dismiss(t.id)}
        >
            <div className="flex-shrink-0 mr-4">
                <div className="h-12 w-12 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                    <img src={tweet.author?.avatar} alt="" className="h-full w-full object-cover" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.1em] opacity-80">New Tweet Alert</span>
                    <span className="text-[10px] text-white/40 font-medium">@{tweet.author?.username}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-bold text-white/90 truncate">{tweet.author?.displayName}</p>
                </div>
                <p className="text-[13px] text-white/80 mt-1 leading-[1.5] line-clamp-2 font-medium">
                    {tweet.content}
                </p>
                <div className="mt-3 text-[10px] text-white/30 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    fake-x.vercel.app
                </div>
            </div>
        </div>
    ), {
        duration: 5000,
        position: "top-right",
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

// In-memory set for instant duplicate prevention (localStorage is slower)
const inMemoryNotified = new Set<string>();

export const triggerTweetNotification = (tweet: any) => {
    if (!tweet?._id) return;

    const notified = getNotifiedTweets();
    if (notified.has(tweet._id) || inMemoryNotified.has(tweet._id)) return;

    if (shouldNotifyForTweet(tweet.content)) {
        inMemoryNotified.add(tweet._id); // Mark instantly
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
        const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => setTimeout(() => reject(new Error("SW Ready Timeout")), 2000))
        ]) as ServiceWorkerRegistration;

        // Subscribe to push service
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        console.log("✅ Push Subscription successful:", subscription);

        // Send to backend
        await axiosInstance.post("/subscribe", {
            userId,
            subscription,
        });

        return subscription;
    } catch (error) {
        console.error("❌ Failed to subscribe user to push:", error);
        throw error; // Throw so AuthContext knows it failed
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
