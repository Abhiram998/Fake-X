"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLocale } from "next-intl";
import {
    Languages,
    Check,
    Loader2,
    ShieldCheck
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const LANGUAGES = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "fr", name: "French", nativeName: "Français" },
];

export default function LanguageSelector() {
    const { user, requestLanguageChange, verifyLanguageChange } = useAuth();
    const t = useTranslations("Language");
    const currentLocale = useLocale();

    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [otpSentTo, setOtpSentTo] = useState<"email" | "mobile">("email");

    const handleLanguageSelect = async (langCode: string) => {
        if (langCode === currentLocale) return;
        if (!user) {
            toast.error(t("login_required"));
            return;
        }

        setIsLoading(true);
        try {
            const res = await requestLanguageChange(langCode);
            // New rules: French -> Email, all others -> Mobile
            setOtpSentTo(langCode === "fr" ? "email" : "mobile");
            setIsOtpOpen(true);
            toast.success(res.message);
        } catch (error: any) {
            toast.error(error.response?.data?.error || t("request_failed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) return;

        setIsLoading(true);
        try {
            await verifyLanguageChange(otp);
            setIsOtpOpen(false);
            setOtp("");
        } catch (error: any) {
            toast.error(error.response?.data?.error || t("invalid_otp"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all duration-300">
                        <Languages className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white min-w-[150px] rounded-xl shadow-2xl p-1 animate-in fade-in slide-in-from-top-2">
                    {LANGUAGES.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex flex-col">
                                <span className={`${currentLocale === lang.code ? "text-blue-400 font-bold" : "text-gray-200"} text-sm`}>
                                    {lang.nativeName}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-tight font-medium">
                                    {lang.name}
                                </span>
                            </div>
                            {currentLocale === lang.code && (
                                <div className="bg-blue-500/20 p-1 rounded-full">
                                    <Check className="h-3 w-3 text-blue-400" />
                                </div>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isOtpOpen} onOpenChange={(open: boolean) => !isLoading && setIsOtpOpen(open)}>
                <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-sm rounded-2xl p-0 overflow-hidden">
                    <div className="bg-blue-500/10 h-1.5 w-full" />

                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <div className="mx-auto bg-blue-500/10 p-4 rounded-full w-fit mb-4">
                                <ShieldCheck className="h-8 w-8 text-blue-400" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-center">{t("verify")}</DialogTitle>
                            <DialogDescription className="text-gray-400 text-center text-sm mt-2">
                                {t("otp_sent", { method: t(otpSentTo) })}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder={t("otp_placeholder")}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="bg-black border-gray-700 focus:border-blue-500 h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-xl transition-all"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-500 hover:bg-blue-600 h-12 text-base font-bold shadow-lg shadow-blue-500/20 rounded-xl transition-all active:scale-[0.98]"
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-white/50" />
                                ) : (
                                    t("verify_button")
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsOtpOpen(false)}
                                className="w-full text-gray-500 hover:text-white"
                                disabled={isLoading}
                            >
                                {t("Common.cancel")}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
