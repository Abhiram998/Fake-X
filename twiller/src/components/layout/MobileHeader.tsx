"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import TwitterLogo from "../Twitterlogo";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import {
    User,
    CreditCard,
    Settings,
    LogOut,
    X,
    Bookmark,
    Users,
    ListOrdered,
    Mic2,
    Briefcase
} from "lucide-react";
import LanguageSelector from "../LanguageSelector";

interface MobileHeaderProps {
    currentPage: string;
    onNavigate: (page: string) => void;
}

export default function MobileHeader({ currentPage, onNavigate }: MobileHeaderProps) {
    const { user, logout } = useAuth();
    const t = useTranslations("Common");
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close drawer on page change
    useEffect(() => {
        setDrawerOpen(false);
    }, [currentPage]);

    if (!user) return null;

    const handleNavigate = (page: string) => {
        onNavigate(page);
        setDrawerOpen(false);
    };

    return (
        <>
            {/* Top Header */}
            <div className="sm:hidden fixed top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 z-40 transition-all duration-300">
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="focus:outline-none shrink-0 p-1 -ml-1 rounded-full hover:bg-gray-900 transition-colors active:scale-95"
                    aria-label="Open menu"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.displayName} />
                        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                    </Avatar>
                </button>

                <div className="absolute left-1/2 -translate-x-1/2">
                    <TwitterLogo size="md" className="text-white" />
                </div>

                <div className="shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full font-bold text-white hover:bg-gray-900"
                        onClick={() => onNavigate("subscriptions")}
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Spacer for Top Header */}
            <div className="sm:hidden h-14" />

            {/* Drawer Overlay */}
            {drawerOpen && (
                <div
                    className="sm:hidden fixed inset-0 bg-white/10 backdrop-blur-[2px] z-[60] transition-opacity duration-300"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* Slide Drawer */}
            <div
                className={`sm:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-black z-[70] transform transition-transform duration-300 ease-out shadow-2xl flex flex-col border-r border-gray-800 ${drawerOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-4 flex flex-col pt-5">
                    <div className="flex justify-between items-start mb-3">
                        <Avatar className="h-10 w-10 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => handleNavigate("profile")}>
                            <AvatarImage src={user.avatar} alt={user.displayName} />
                            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <button
                            onClick={() => setDrawerOpen(false)}
                            className="text-white p-1 rounded-full hover:bg-gray-900 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="cursor-pointer min-w-0" onClick={() => handleNavigate("profile")}>
                        <div className="text-white font-bold text-lg leading-tight truncate lg:whitespace-normal overflow-anywhere">{user.displayName}</div>
                        <div className="text-gray-500 text-sm truncate mb-4 overflow-anywhere">@{user.username}</div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm mb-6 min-w-0">
                        <div className="flex flex-wrap gap-4 text-sm mb-6 min-w-0">
                            <div className="text-gray-500 hover:underline cursor-pointer whitespace-nowrap">
                                <span className="text-white font-bold">{user.followingCount || 0}</span> {t("following")}
                            </div>
                            <div className="text-gray-500 hover:underline cursor-pointer whitespace-nowrap">
                                <span className="text-white font-bold">{user.followersCount || 0}</span> {t("followers")}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <nav className="flex flex-col">
                        <DrawerItem icon={User} label={t("profile")} onClick={() => handleNavigate("profile")} />
                        <DrawerItem icon={CreditCard} label={t("premium")} onClick={() => handleNavigate("subscriptions")} />
                        <DrawerItem icon={Users} label={t("communities")} onClick={() => { }} />
                        <DrawerItem icon={Bookmark} label={t("bookmarks")} onClick={() => handleNavigate("bookmarks")} />
                        <DrawerItem icon={ListOrdered} label={t("lists")} onClick={() => { }} />
                        <DrawerItem icon={Mic2} label={t("spaces")} onClick={() => { }} />
                        <DrawerItem icon={Briefcase} label={t("creator_studio")} onClick={() => { }} />

                        <div className="h-px bg-gray-800 my-2 mx-1" />

                        <button
                            className="flex justify-between items-center px-4 py-3 text-white hover:bg-gray-900 w-full text-left transition-colors"
                        >
                            <span className="text-[17px] font-bold">{t("settings_support")}</span>
                        </button>

                        <button
                            onClick={() => {
                                logout();
                                setDrawerOpen(false);
                            }}
                            className="flex items-center px-4 py-3 text-red-500 hover:bg-gray-900 w-full text-left transition-colors"
                        >
                            <LogOut className="h-5 w-5 mr-5" />
                            <span className="text-[17px] font-bold">{t("logout")}</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-black">
                    <TwitterLogo size="sm" className="text-white" />
                    <LanguageSelector />
                </div>
            </div>
        </>
    );
}

function DrawerItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center px-4 py-3 text-white hover:bg-gray-900 w-full text-left transition-colors active:bg-gray-800"
        >
            <Icon className="h-6 w-6 mr-5" />
            <span className="text-[19px] font-bold">{label}</span>
        </button>
    );
}
