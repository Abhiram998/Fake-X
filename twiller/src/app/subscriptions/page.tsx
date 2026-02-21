"use client";

import { AuthProvider } from "@/context/AuthContext";
import SubscriptionPage from "@/components/SubscriptionPage";
import Mainlayout from "@/components/layout/Mainlayout";

// This page exists so Stripe can redirect to /subscriptions after payment
// The SubscriptionPage component handles the ?success=true&session_id=... query params
export default function SubscriptionsRoute() {
    return (
        <AuthProvider>
            <Mainlayout>
                <SubscriptionPage />
            </Mainlayout>
        </AuthProvider>
    );
}
