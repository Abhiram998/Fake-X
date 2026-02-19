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
        alert("This browser does not support desktop notifications");
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
};

export const showNotification = async (title: string, body: string, icon?: string) => {
    if (checkNotificationPermission() !== "granted") return;

    const options = {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
        tag: "tweet-alert",
        vibrate: [200, 100, 200],
        renotify: true, // Overwrite previous notification with same tag
    };

    try {
        // Try using Service Worker first (Better for mobile/Android)
        if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration) {
                await registration.showNotification(title, options);
                return;
            }
        }

        // Fallback to standard Notification (Desktop)
        new Notification(title, options);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const shouldNotifyForTweet = (content: string): boolean => {
    if (!content) return false;
    const lowercaseContent = content.toLowerCase();
    return keywords.some((keyword) => lowercaseContent.includes(keyword.toLowerCase()));
};

// Map to keep track of notified tweet IDs to prevent duplicates in current session
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
