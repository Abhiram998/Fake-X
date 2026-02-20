"use client";

import React, { useState } from "react";
import { KeyRound, ArrowLeft, Mail, Phone, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import axiosInstance from "@/lib/axiosInstance";

export default function ForgotPasswordPage() {
    const [identity, setIdentity] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identity.trim()) return;

        setIsLoading(true);
        setError(null);
        setIsSuccess(false);

        try {
            const res = await axiosInstance.post("/forgot-password", { identity });
            if (res.data.error) {
                setError(res.data.error);
            } else {
                setIsSuccess(true);
                setSuccessMessage(res.data.message || "A new password has been sent to your registered email.");
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || "Failed to reset password. Please try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md bg-gray-950 border-gray-800 text-white overflow-hidden shadow-2xl">
                <CardHeader className="space-y-1 text-center bg-gray-900/40 border-b border-gray-800 pb-8">
                    <div className="mx-auto bg-blue-500/10 p-4 rounded-full w-fit mb-4">
                        <KeyRound className="h-8 w-8 text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password?</CardTitle>
                    <CardDescription className="text-gray-400">
                        Enter your identity to receive a one-time generated password.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={handleReset} className="space-y-6">
                        {!isSuccess ? (
                            <>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="identity" className="text-gray-300">Email or Phone Number</Label>
                                        <div className="relative">
                                            <Input
                                                id="identity"
                                                placeholder="example@email.com or +91..."
                                                value={identity}
                                                onChange={(e) => setIdentity(e.target.value)}
                                                className="bg-black border-gray-700 focus:border-blue-500 pl-10 h-12"
                                                disabled={isLoading}
                                                required
                                            />
                                            <div className="absolute left-3 top-3.5 text-gray-500">
                                                {identity.includes('@') ? <Mail className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-400 text-left leading-relaxed">
                                                {error}
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                                        <p className="text-xs text-blue-400 leading-relaxed text-center italic">
                                            You can use this option only one time per day.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-blue-500 hover:bg-blue-600 h-12 text-base font-semibold transition-all hover:scale-[1.02]"
                                    disabled={isLoading || !identity.trim()}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : "Generate New Password"}
                                </Button>
                            </>
                        ) : (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="bg-green-500/10 border border-green-500/50 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
                                    <div className="bg-green-500/20 p-3 rounded-full">
                                        <ShieldCheck className="h-10 w-10 text-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Check Your Email</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {successMessage}
                                        </p>
                                    </div>
                                </div>

                                <Link href="/login" className="block w-full">
                                    <Button
                                        className="w-full bg-blue-500 hover:bg-blue-600 h-12 text-base font-semibold transition-all"
                                    >
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-800 flex justify-center">
                        <Link
                            href="/"
                            className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <p className="mt-8 text-xs text-gray-600 uppercase tracking-[0.2em] font-medium">
                Twiller Verification System &bull; Training Mode
            </p>
        </div>
    );
}
