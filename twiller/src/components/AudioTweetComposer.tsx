"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Lock, Eye, EyeOff, Upload, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { DateTime } from "luxon";

interface AudioTweetComposerProps {
    onAudioUploaded: (audioUrl: string) => void;
    onCancel: () => void;
}

export default function AudioTweetComposer({ onAudioUploaded, onCancel }: AudioTweetComposerProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<"otp-request" | "otp-verify" | "upload">("otp-request");
    const [email, setEmail] = useState(user?.email || "");
    const [otp, setOtp] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Time restriction check: 2 PM - 7 PM IST
    const isTimeAllowed = () => {
        const nowIST = DateTime.now().setZone("Asia/Kolkata");
        const hour = nowIST.hour;
        const minute = nowIST.minute;
        // TEMPORARY FOR TESTING: 2:00 PM (14:00) to 11:59 PM (23:59)
        if (hour < 14) {
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (!isTimeAllowed()) {
            setError("Audio tweets are allowed only between 2:00 PM and 11:59 PM IST (Testing Window).");
        }
    }, []);

    const handleRequestOtp = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await axiosInstance.post("/request-otp", { email });
            setStep("otp-verify");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await axiosInstance.post("/verify-otp", { email, code: otp });
            setStep("upload");
        } catch (err: any) {
            setError(err.response?.data?.error || "Invalid OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                if (blob.size > 100 * 1024 * 1024) {
                    setError("File size exceeds 100MB limit.");
                    return;
                }
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);
            timerRef.current = setInterval(() => {
                setDuration((prev) => {
                    if (prev >= 300) {
                        stopRecording();
                        return 300;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            setError("Microphone permission denied or not found.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 100 * 1024 * 1024) {
                setError("File size exceeds 100MB limit.");
                return;
            }

            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                if (audio.duration > 300) {
                    setError("Audio duration exceeds 5 minutes limit.");
                    return;
                }
                setAudioBlob(file);
                setAudioUrl(audio.src);
                setDuration(Math.round(audio.duration));
            };
        }
    };

    const handleUploadToBackend = async () => {
        if (!audioBlob) return;
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("email", email);
        formData.append("duration", duration.toString());

        try {
            const res = await axiosInstance.post("/upload-audio", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onAudioUploaded(res.data.audioUrl);
        } catch (err: any) {
            setError(err.response?.data?.error || "Upload failed");
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Card className="bg-gray-950 border-gray-800 text-white w-full max-w-md mx-auto">
            <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Mic className="text-blue-400" /> Audio Tweet
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400">Cancel</Button>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-800 text-red-400 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {step === "otp-request" && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400">Verify your identity to enable audio features.</p>
                        <div className="space-y-2">
                            <Label>Registered Email</Label>
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                className="bg-black border-gray-700"
                                disabled={!!user?.email}
                            />
                        </div>
                        <Button
                            className="w-full bg-blue-500 hover:bg-blue-600"
                            onClick={handleRequestOtp}
                            disabled={isLoading || !isTimeAllowed()}
                        >
                            {isLoading ? "Sending..." : "Request OTP"}
                        </Button>
                    </div>
                )}

                {step === "otp-verify" && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400">Enter the code sent to {email}.</p>
                        <div className="space-y-2">
                            <Label>OTP Code</Label>
                            <Input
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit code"
                                className="bg-black border-gray-700 text-center text-2xl tracking-widest"
                            />
                        </div>
                        <Button
                            className="w-full bg-blue-500 hover:bg-blue-600"
                            onClick={handleVerifyOtp}
                            disabled={isLoading || otp.length < 6}
                        >
                            Verify OTP
                        </Button>
                        <Button variant="link" onClick={() => setStep("otp-request")} className="w-full text-xs text-gray-500">
                            Resend Code
                        </Button>
                    </div>
                )}

                {step === "upload" && (
                    <div className="space-y-6">
                        {!audioUrl ? (
                            <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed border-gray-800 rounded-xl">
                                <div className="flex gap-4">
                                    <Button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        variant={isRecording ? "destructive" : "outline"}
                                        className="h-16 w-16 rounded-full flex items-center justify-center p-0"
                                    >
                                        {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                                    </Button>

                                    <label className="h-16 w-16 rounded-full border border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-900 transition-colors">
                                        <Upload className="h-6 w-6 text-gray-400" />
                                        <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                </div>

                                <div className="text-center">
                                    <p className="text-lg font-mono">{formatTime(duration)}</p>
                                    <p className="text-xs text-gray-500">Max 5:00 / 100MB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gray-900 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Volume2 className="text-blue-400" />
                                        <div>
                                            <p className="text-sm font-medium">Recording Ready</p>
                                            <p className="text-xs text-gray-400">{formatTime(duration)}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { setAudioUrl(null); setAudioBlob(null); setDuration(0); }}>
                                        <Trash2 className="h-4 w-4 text-red-400" />
                                    </Button>
                                </div>
                                <audio src={audioUrl} controls className="w-full h-8" />
                                <Button
                                    className="w-full bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
                                    onClick={handleUploadToBackend}
                                    disabled={isLoading}
                                >
                                    <Send className="h-4 w-4" /> {isLoading ? "Uploading..." : "Ready to Post"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
