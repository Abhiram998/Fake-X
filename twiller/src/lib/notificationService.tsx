import toast from "react-hot-toast";

/**
 * Utility service for handling Browser Notifications
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

export const showNotification = async (title: string, body: string, icon?: string) => {
    console.log("🔔 Notification triggered:", title);

    const nativeSupported = typeof window !== "undefined" && "Notification" in window;
    const isMobile = isMobileDevice();
    const permission = checkNotificationPermission();

    if (isMobile || !nativeSupported || permission !== "granted") {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-blue-600 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
                <div className="flex-1 w-0">
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="mt-1 text-xs text-blue-100">{body}</p>
                </div>
            </div>
        ), {
            duration: 4000,
            position: "top-center",
        });
        return;
    }

    const options = {
        body,
        icon: icon || "/favicon.ico",
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
    } catch (error) {
        console.error("❌ Error creating native notification:", error);
    }
};

export const shouldNotifyForTweet = (content: string): boolean => {
    if (!content) return false;
    const lowercaseContent = content.toLowerCase();
    return keywords.some((keyword) => lowercaseContent.includes(keyword.toLowerCase()));
};

const notifiedTweets = new Set<string>();

export const triggerTweetNotification = (tweet: { _id: string; content: string; author?: { displayName: string } }) => {
    if (notifiedTweets.has(tweet._id)) return;

    if (shouldNotifyForTweet(tweet.content)) {
        const authorName = tweet.author?.displayName || "Someone";
        showNotification(
            `New Tweet from ${authorName}`,
            tweet.content.length > 100 ? tweet.content.slice(0, 97) + "..." : tweet.content,
            "/favicon.ico"
        );
        notifiedTweets.add(tweet._id);
    }
};
