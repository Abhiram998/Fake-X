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

export const showNotification = (title: string, body: string, icon?: string) => {
    if (checkNotificationPermission() === "granted") {
        try {
            const notification = new Notification(title, {
                body,
                icon: icon || "/favicon.ico",
                badge: "/favicon.ico", // Android support
                tag: "tweet-alert",    // Group related notifications
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error("Error creating notification:", error);
        }
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
