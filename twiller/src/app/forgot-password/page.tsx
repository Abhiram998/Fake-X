"use client";

import React, { useState } from "react";
import { KeyRound, ArrowLeft, Mail, Phone, ShieldCheck, AlertCircle, Copy, Check } from "lucide-react";
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
    const [successData, setSuccessData] = useState<{ newPassword: string; message: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identity.trim()) return;

        setIsLoading(true);
        setError(null);
        setSuccessData(null);

        try {
            const res = await axiosInstance.post("/forgot-password", { identity });
            if (res.data.error) {
                setError(res.data.error);
            } else if (res.data.newPassword) {
                setSuccessData({
                    newPassword: res.data.newPassword,
                    message: res.data.message
                });
            } else {
                // For non-demo security, we might not show the password
                setError(res.data.message || "Request processed.");
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || "Failed to reset password. Please try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (successData?.newPassword) {
            navigator.clipboard.writeText(successData.newPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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
                        {!successData ? (
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
                                            Rule: You can only reset your password once every 24 hours.
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
                                <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-xl flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6 text-green-500 shrink-0" />
                                    <p className="text-sm font-medium text-green-400">
                                        Success! Please save your temporary password.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-gray-400 text-xs uppercase tracking-widest font-bold">Your New Password</Label>
                                    <div className="relative group">
                                        <div className="bg-black border-2 border-dashed border-gray-700 rounded-2xl p-6 text-center">
                                            <span className="text-3xl font-mono font-bold text-blue-400 tracking-wider">
                                                {successData.newPassword}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="absolute top-2 right-2 text-gray-500 hover:text-white"
                                            onClick={copyToClipboard}
                                        >
                                            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 text-center uppercase tracking-tighter">
                                        Note: This password contains alphabetical characters only (A-Z, a-z).
                                    </p>
                                </div>

                                <Button
                                    className="w-full bg-gray-800 hover:bg-gray-700 h-12"
                                    onClick={() => window.location.href = '/'}
                                >
                                    Go to Login
                                </Button>
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
