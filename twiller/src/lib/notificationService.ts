/**
 * Utility service for handling Browser Notifications
 */

export const keywords = ["cricket", "science"];

export const checkNotificationPermission = (): NotificationPermission => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return "denied";
    }
    return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
};

export const showNotification = (title: string, body: string, icon?: string) => {
    if (checkNotificationPermission() === "granted") {
        try {
            new Notification(title, {
                body,
                icon: icon || "/favicon.ico", // Fallback to a default logo if provided
            });
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    }
};

export const shouldNotifyForTweet = (content: string): boolean => {
    const lowercaseContent = content.toLowerCase();
    return keywords.some((keyword) => lowercaseContent.includes(keyword.toLowerCase()));
};

// Map to keep track of notified tweet IDs to prevent duplicates in current session
const notifiedTweets = new Set<string>();

export const triggerTweetNotification = (tweet: { _id: string; content: string; author?: { displayName: string } }) => {
    if (notifiedTweets.has(tweet._id)) return;

    if (shouldNotifyForTweet(tweet.content)) {
        showNotification(
            "New Tweet Alert",
            tweet.content,
            "/favicon.ico" // Replace with actual app logo path if available
        );
        notifiedTweets.add(tweet._id);
    }
};
