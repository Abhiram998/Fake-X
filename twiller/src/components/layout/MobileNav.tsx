"use client";

import React from 'react';
import { Home, Search, Bell, Mail } from 'lucide-react';
import { Button } from '../ui/button';

interface MobileNavProps {
    currentPage: string;
    onNavigate: (page: string) => void;
}

export default function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
    const items = [
        { icon: Home, page: 'home' },
        { icon: Search, page: 'explore' },
        { icon: Bell, page: 'notifications' },
        { icon: Mail, page: 'messages' },
    ];

    return (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-black border-t border-gray-800 flex items-center justify-around px-2 z-50">
            {items.map((item, i) => (
                <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className={`flex-1 flex flex-col items-center justify-center h-full rounded-none hover:bg-transparent ${currentPage === item.page ? 'text-white' : 'text-gray-500'
                        }`}
                    onClick={() => onNavigate(item.page)}
                >
                    <item.icon className={`h-6 w-6 ${currentPage === item.page ? 'fill-current' : ''}`} />
                </Button>
            ))}
        </div>
    );
}
