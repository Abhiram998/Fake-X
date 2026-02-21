"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { CreditCard, Zap, Star, Crown, CheckCircle2, AlertCircle, Sparkles, Lock } from "lucide-react";

const PLANS = [
    {
        name: "Free",
        price: 0,
        limit: 1,
        color: "border-gray-700",
        badge: "bg-gray-800 text-gray-300",
        icon: <Zap className="h-6 w-6 text-gray-400" />,
        gradient: "from-gray-900 to-gray-800",
        textColor: "text-gray-300",
        features: ["1 tweet per day", "Basic access", "No payment required"],
    },
    {
        name: "Bronze",
        price: 100,
        limit: 3,
        color: "border-amber-700",
        badge: "bg-amber-900/40 text-amber-400",
        icon: <Star className="h-6 w-6 text-amber-500" />,
        gradient: "from-amber-950 to-gray-900",
        textColor: "text-amber-400",
        features: ["3 tweets per day", "Standard access", "Valid for 30 days"],
    },
    {
        name: "Silver",
        price: 300,
        limit: 5,
        color: "border-slate-500",
        badge: "bg-slate-700/40 text-slate-300",
        icon: <Star className="h-6 w-6 text-slate-300" />,
        gradient: "from-slate-900 to-gray-900",
        textColor: "text-slate-300",
        features: ["5 tweets per day", "Priority access", "Valid for 30 days"],
    },
    {
        name: "Gold",
        price: 1000,
        limit: Infinity,
        color: "border-yellow-500",
        badge: "bg-yellow-900/40 text-yellow-400",
        icon: <Crown className="h-6 w-6 text-yellow-400" />,
        gradient: "from-yellow-950 to-gray-900",
        textColor: "text-yellow-400",
        features: ["Unlimited tweets", "Full access", "Valid for 30 days", "Priority support"],
    },
];



export default function SubscriptionPage() {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const isSuccess = query.get("success");
        const isCanceled = query.get("canceled");
        const session_id = query.get("session_id");
        const planName = query.get("planName");

        if (isSuccess && session_id && planName && user) {
            const verifyPayment = async () => {
                setLoading(true);
                try {
                    const verifyRes = await axiosInstance.post("/verify-payment", {
                        session_id,
                        planName,
                        email: user.email,
                    });

                    if (verifyRes.data.message) {
                        setSuccess(`🎉 Successfully upgraded to ${planName} plan! Invoice sent to ${user.email}.`);
                        const refreshed = await axiosInstance.get("/loggedinuser", { params: { email: user.email } });
                        if (refreshed.data) {
                            localStorage.setItem("twitter-user", JSON.stringify(refreshed.data));
                            window.history.replaceState({}, document.title, window.location.pathname);
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        }
                    }
                } catch (err: any) {
                    setError(err.response?.data?.error || "Payment verification failed.");
                } finally {
                    setLoading(false);
                }
            };
            verifyPayment();
        } else if (isCanceled) {
            setError("Payment was canceled.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [user]);

    const currentPlan = user?.subscriptionPlan || "Free";
    const currentLimit = PLANS.find((p) => p.name === currentPlan)?.limit ?? 1;
    const tweetsUsed = user?.tweetCount || 0;
    const tweetsLeft = currentPlan === "Gold" ? "∞" : Math.max(0, currentLimit - tweetsUsed);
    const usagePercent = currentPlan === "Gold" ? 0 : Math.min(100, (tweetsUsed / (currentLimit as number)) * 100);

    const expiryDate = user?.subscriptionExpiryDate
        ? new Date(user.subscriptionExpiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : null;

    const handleSubscribe = async (planName: string, price: number) => {
        if (!user) return;
        if (planName === "Free") return;
        setError(null);
        setSuccess(null);
        setLoading(true);
        setSelectedPlan(planName);

        try {
            // Step 1: Create Stripe session
            const orderRes = await axiosInstance.post("/create-checkout-session", {
                planName,
                email: user.email,
            });

            const { id } = orderRes.data;

            // Step 2: Open Stripe Checkout
            const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
            if (stripe) {
                await stripe.redirectToCheckout({ sessionId: id });
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || "Something went wrong.";
            setError(msg);
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800 px-6 py-4">
                <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-blue-400" />
                    <div>
                        <h1 className="text-xl font-bold">Subscriptions</h1>
                        <p className="text-xs text-gray-500">Manage your tweet plan</p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {/* Current Plan Card */}
                <div className="bg-gradient-to-br from-blue-950 to-gray-900 rounded-3xl border border-blue-800/50 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs text-blue-400 uppercase tracking-widest font-bold">Current Plan</p>
                            <h2 className="text-3xl font-black mt-1">{currentPlan}</h2>
                        </div>
                        <div className="bg-blue-500/10 p-4 rounded-2xl">
                            {PLANS.find((p) => p.name === currentPlan)?.icon}
                        </div>
                    </div>

                    {/* Usage bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Tweet Usage</span>
                            <span className="font-mono font-bold text-blue-400">
                                {tweetsUsed} / {currentPlan === "Gold" ? "∞" : currentLimit}
                            </span>
                        </div>
                        {currentPlan !== "Gold" && (
                            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${usagePercent >= 100 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-blue-500"
                                        }`}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                        )}
                        {currentPlan === "Gold" && (
                            <div className="w-full bg-yellow-500/20 rounded-full h-2.5">
                                <div className="w-full h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400" />
                            </div>
                        )}
                        <p className="text-xs text-gray-500">
                            {currentPlan === "Gold"
                                ? "Unlimited tweets active"
                                : usagePercent >= 100
                                    ? "Limit reached. Upgrade to post more."
                                    : `${tweetsLeft} tweet${tweetsLeft !== 1 ? "s" : ""} remaining`}
                        </p>
                    </div>

                    {expiryDate && currentPlan !== "Free" && (
                        <p className="mt-4 text-xs text-gray-500 border-t border-gray-700/50 pt-4">
                            Plan valid until: <span className="text-white font-semibold">{expiryDate}</span>
                        </p>
                    )}
                </div>

                {/* Payment window notice */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-yellow-300">Payment Window</p>
                        <p className="text-xs text-yellow-500 mt-1">
                            Payments are only accepted between <strong>10:00 AM – 11:00 AM IST</strong> daily. Plan browsing is always available.
                        </p>
                    </div>
                </div>

                {/* Error / Success */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/40 rounded-2xl p-4 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-400">{success}</p>
                    </div>
                )}

                {/* Plan Cards */}
                <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-400" /> Choose a Plan
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {PLANS.map((plan) => {
                            const isCurrent = currentPlan === plan.name;
                            const isPending = loading && selectedPlan === plan.name;

                            return (
                                <div
                                    key={plan.name}
                                    className={`relative rounded-3xl border-2 p-6 transition-all duration-300 bg-gradient-to-br ${plan.gradient} ${isCurrent ? `${plan.color} shadow-lg scale-[1.02]` : `${plan.color} hover:scale-[1.01] opacity-90 hover:opacity-100`
                                        }`}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow">
                                                Active
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${plan.badge}`}>
                                                {plan.name}
                                            </span>
                                            <p className={`text-3xl font-black mt-3 ${plan.textColor}`}>
                                                {plan.price === 0 ? "Free" : `₹${plan.price}`}
                                                {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/month</span>}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/60 p-3 rounded-2xl">{plan.icon}</div>
                                    </div>

                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {plan.name === "Free" ? (
                                        <button
                                            disabled
                                            className="w-full py-3 rounded-2xl bg-gray-700/50 text-gray-500 text-sm font-semibold cursor-not-allowed"
                                        >
                                            Default Plan
                                        </button>
                                    ) : isCurrent ? (
                                        <button
                                            disabled
                                            className="w-full py-3 rounded-2xl bg-blue-500/20 text-blue-400 text-sm font-semibold border border-blue-500/40 cursor-not-allowed"
                                        >
                                            ✓ Current Plan
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe(plan.name, plan.price)}
                                            disabled={loading}
                                            className={`w-full py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${isPending
                                                ? "bg-gray-700 text-gray-400 cursor-wait"
                                                : "bg-blue-500 hover:bg-blue-600 text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20"
                                                }`}
                                        >
                                            {isPending ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                `Upgrade to ${plan.name} — ₹${plan.price}`
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info */}
                <div className="text-center text-xs text-gray-600 space-y-1 pb-10">
                    <p>All payments are processed securely via Stripe.</p>
                    <p>Subscriptions auto-expire after 30 days. No auto-renewal.</p>
                    <p>Invoice will be sent to your registered email after payment.</p>
                </div>
            </div>
        </div>
    );
}
