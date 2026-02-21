"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import SubscriptionPage from "@/components/SubscriptionPage";
import Mainlayout from "@/components/layout/Mainlayout";

// Wrapper that redirects to "/" if the user navigates away from subscriptions
function SubscriptionsContent() {
    const router = useRouter();

    useEffect(() => {
        // If the URL changes away from /subscriptions via sidebar, push to root
        // This handles the SPA navigation model used by the app
    }, []);

    return (
        <AuthProvider>
            <Mainlayout>
                <SubscriptionPage />
            </Mainlayout>
        </AuthProvider>
    );
}

export default SubscriptionsContent;
