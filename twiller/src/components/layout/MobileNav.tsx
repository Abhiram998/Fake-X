"use client";

import React from 'react';
import { Home, Search, Bell, Mail, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';

interface MobileNavProps {
    currentPage: string;
    onNavigate: (page: string) => void;
}

export default function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
    const t = useTranslations('Common');
    const items = [
        { icon: Home, page: 'home', label: t('home') },
        { icon: Search, page: 'explore', label: t('explore') },
        { icon: Plus, page: 'post', label: t('post'), isSpecial: true },
        { icon: Bell, page: 'notifications', label: t('notifications') },
        { icon: Mail, page: 'messages', label: t('messages') },
    ];

    return (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-black border-t border-gray-800 flex items-center justify-around px-2 z-50 transition-all duration-300">
            {items.map((item, i) => (
                <Button
                    key={i}
                    variant="ghost"
                    size="lg"
                    className={`flex-1 flex flex-col items-center justify-center h-full rounded-none hover:bg-transparent active:scale-95 transition-transform ${currentPage === item.page ? 'text-white' : 'text-gray-500'
                        }`}
                    onClick={() => onNavigate(item.page)}
                >
                    <div className={`relative p-2 ${item.isSpecial ? 'bg-blue-500 text-white rounded-full p-1.5' : ''}`}>
                        <item.icon
                            className={`${item.isSpecial ? 'h-6 w-6' : 'h-7 w-7'} ${currentPage === item.page && !item.isSpecial ? 'fill-current' : ''
                                }`}
                        />
                    </div>
                </Button>
            ))}
        </div>
    );
}
