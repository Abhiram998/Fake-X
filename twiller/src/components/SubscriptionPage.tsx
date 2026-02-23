"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { CreditCard, Zap, Star, Crown, CheckCircle2, AlertCircle, Sparkles, Lock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

const getPlans = (t: any) => [
    {
        name: "Free",
        price: 0,
        limit: 1,
        color: "border-gray-700",
        badge: "bg-gray-800 text-gray-300",
        icon: <Zap className="h-6 w-6 text-gray-400" />,
        gradient: "from-gray-900 to-gray-800",
        textColor: "text-gray-300",
        features: [
            t('tweets_per_day', { count: 1 }),
            t('basic_access'),
            t('no_payment')
        ],
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
        features: [
            t('tweets_per_day', { count: 3 }),
            t('standard_access'),
            t('valid_days', { count: 30 })
        ],
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
        features: [
            t('tweets_per_day', { count: 5 }),
            t('priority_access'),
            t('valid_days', { count: 30 })
        ],
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
        features: [
            t('unlimited_tweets'),
            t('full_access'),
            t('valid_days', { count: 30 }),
            t('priority_support')
        ],
    },
];

export default function SubscriptionPage() {
    const { user, login } = useAuth();
    const t = useTranslations('Subscriptions');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [viewingPlan, setViewingPlan] = useState<string>("Bronze");

    const PLANS = getPlans(t);

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
        ? new Date(user.subscriptionExpiryDate).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
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

            const { url } = orderRes.data;

            // Step 2: Redirect directly to Stripe Checkout URL (no SDK needed)
            if (url) {
                window.location.href = url;
            } else {
                setError("Could not get payment URL. Please try again.");
                setLoading(false);
                setSelectedPlan(null);
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || "Something went wrong.";
            setError(msg);
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white relative font-sans selection:bg-gray-700">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md px-4 py-3 flex items-center gap-6 border-b border-gray-800">
                <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors -ml-2 text-white">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
                </button>
                <h1 className="text-xl font-bold">{t('title') || 'Subscribe'}</h1>
            </div>

            <div className="py-6 space-y-6">
                {/* Notice & Error Groups */}
                <div className="px-4 space-y-3">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-start gap-3">
                        <Lock className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-200 break-words">{t('payment_window_title')}</p>
                            <p className="text-xs text-gray-400 mt-1 overflow-anywhere wrap-safe">
                                {t.rich('payment_window_desc', { strong: (chunks) => <strong className="text-gray-200">{chunks}</strong> })}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/40 rounded-2xl p-4 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-green-500">{success}</p>
                        </div>
                    )}
                </div>

                {/* Current Usage */}
                <div className="px-4">
                    <div className="bg-[#16181c] rounded-2xl p-5 border border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('current_plan')}</p>
                                <h2 className="text-2xl font-bold mt-1 text-white">{currentPlan}</h2>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-full shrink-0">
                                {PLANS.find((p) => p.name === currentPlan)?.icon || <Zap className="h-5 w-5 text-gray-400" />}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">{t('tweet_usage')}</span>
                                <span className="font-bold text-white">
                                    {tweetsUsed} <span className="text-gray-500">/ {currentPlan === "Gold" ? "∞" : currentLimit}</span>
                                </span>
                            </div>
                            {currentPlan !== "Gold" && (
                                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${usagePercent >= 100 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-white"}`}
                                        style={{ width: `${usagePercent}%` }}
                                    />
                                </div>
                            )}
                            {currentPlan === "Gold" && (
                                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full" />
                                </div>
                            )}
                            <p className="text-xs text-gray-500 overflow-anywhere">
                                {currentPlan === "Gold"
                                    ? t('unlimited')
                                    : usagePercent >= 100
                                        ? t('limit_reached')
                                        : t('remaining', { count: tweetsLeft, posts: tweetsLeft !== 1 ? tCommon('tweet') + 's' : tCommon('tweet') })}
                            </p>
                        </div>
                        {expiryDate && currentPlan !== "Free" && (
                            <p className="mt-4 text-xs text-gray-500 pt-4 border-t border-gray-800">
                                {t('valid_until')} <span className="text-white">{expiryDate}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Plan Carousel Title */}
                <div className="px-4">
                    <h3 className="text-xl font-bold tracking-tight text-white mb-1 flex items-center gap-2 flex-wrap overflow-anywhere">
                        {t('premium_benefits') || 'Premium Benefits'}
                    </h3>
                </div>
                {/* Plan Grid Container */}
                <div className="grid grid-cols-2 gap-4 px-4 pb-2">
                    {PLANS.map((plan) => {
                        const isCurrent = currentPlan === plan.name;
                        const isSelected = viewingPlan === plan.name;

                        return (
                            <div
                                key={plan.name}
                                onClick={() => setViewingPlan(plan.name)}
                                className={`rounded-2xl flex flex-col transition-all cursor-pointer bg-[#16181c] border-2 ${isSelected ? 'border-white' : 'border-[#2f3336] hover:border-gray-500'}`}
                            >
                                <div className="h-28 bg-[url('https://abs.twimg.com/sticky/illustrations/blue_header.png')] bg-cover bg-center rounded-t-xl relative flex items-center justify-center border-b border-[#2f3336] overflow-hidden">
                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
                                    <div className="relative z-10 flex flex-col items-center gap-1">
                                        <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                                        {isCurrent && (
                                            <div className="text-[9px] bg-white text-black px-2 py-0.5 rounded font-bold uppercase tracking-widest leading-none">
                                                {t('active_badge') || 'Active'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col min-w-0">
                                    <div className="flex items-baseline flex-wrap gap-1 mb-2">
                                        <span className="text-2xl font-bold text-white leading-none break-all">{plan.price === 0 ? "Free" : `₹${plan.price}`}</span>
                                        {plan.price > 0 && <span className="text-xs text-gray-500 font-medium whitespace-nowrap">/ month</span>}
                                    </div>
                                    <div className="text-[13px] font-bold text-gray-300 uppercase tracking-widest border-b border-gray-800 pb-2 mb-3 truncate">
                                        Enhanced Experience
                                    </div>
                                    <div className="space-y-4 pb-2 flex-1">
                                        {plan.features.map((f) => (
                                            <div key={f} className="flex justify-between items-start gap-2">
                                                <span className="text-[14px] text-gray-400 leading-tight overflow-anywhere wrap-safe">{f}</span>
                                                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[16px] h-[16px] shrink-0 fill-[#00ba7c] mt-0.5"><g><path d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12S6.34 22.25 12 22.25 22.25 17.66 22.25 12 17.66 1.75 12 1.75zm-.81 14.68l-4.1-3.27 1.25-1.57 2.47 1.98 3.97-5.47 1.62 1.18-5.21 7.15z"></path></g></svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center text-[11px] text-gray-600 px-4 pb-24">
                    <p>{t('secure_payments')} • {t('auto_expire')} • {t('invoice_sent')}</p>
                </div>
            </div>

            {/* Sticky Bottom Contextual Inside the Parent Container - perfectly bound to 600px width natively */}
            <div className="sticky bottom-0 sm:bottom-0 bg-black/90 backdrop-blur-md border-t border-gray-800 p-4 pb-[80px] sm:pb-6 z-40 w-full mt-auto">
                <button
                    onClick={() => {
                        const plan = PLANS.find(p => p.name === viewingPlan);
                        if (plan) handleSubscribe(plan.name, plan.price);
                    }}
                    disabled={loading || viewingPlan === "Free" || currentPlan === viewingPlan}
                    className={`w-full max-w-sm mx-auto rounded-full py-3.5 text-[16px] font-bold transition-all flex justify-center items-center px-4 ${loading ? 'bg-[#333639] text-[#71767b] cursor-wait' : (viewingPlan === "Free" || currentPlan === viewingPlan) ? 'bg-[#333639] text-[#71767b] cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200 active:scale-[0.98]'}`}
                >
                    {loading && viewingPlan === selectedPlan ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="h-5 w-5 border-2 border-[#71767b] border-t-white rounded-full animate-spin" />
                            <span className="truncate">Processing...</span>
                        </span>
                    ) : currentPlan === viewingPlan ? (
                        <span className="truncate">{t('current_plan_button') || "Current Plan"}</span>
                    ) : viewingPlan === "Free" ? (
                        <span className="truncate">Default Plan</span>
                    ) : (
                        <span className="truncate">
                            {t('start_at', {
                                price: (PLANS.find(p => p.name === viewingPlan)?.price ?? 0).toFixed(2)
                            }) || `Starting at ₹${(PLANS.find(p => p.name === viewingPlan)?.price ?? 0).toFixed(2)}`}
                        </span>
                    )}
                </button>
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
