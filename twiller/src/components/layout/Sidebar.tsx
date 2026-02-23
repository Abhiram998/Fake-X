"use client";

import React from 'react';

import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  MoreHorizontal,
  Settings,
  LogOut,
  CreditCard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import TwitterLogo from '../Twitterlogo';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import LanguageSelector from '../LanguageSelector';

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export default function Sidebar({ currentPage = 'home', onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const t = useTranslations('Common');
  const tSub = useTranslations('Subscriptions');

  const navigation = [
    { name: t('home'), icon: Home, current: currentPage === 'home', page: 'home' },
    { name: t('explore'), icon: Search, current: currentPage === 'explore', page: 'explore' },
    { name: t('notifications'), icon: Bell, current: currentPage === 'notifications', page: 'notifications', badge: true },
    { name: t('messages'), icon: Mail, current: currentPage === 'messages', page: 'messages' },
    { name: t('bookmarks'), icon: Bookmark, current: currentPage === 'bookmarks', page: 'bookmarks' },
    { name: t('profile'), icon: User, current: currentPage === 'profile', page: 'profile' },
    { name: t('subscriptions'), icon: CreditCard, current: currentPage === 'subscriptions', page: 'subscriptions' },
    { name: t('more'), icon: MoreHorizontal, current: currentPage === 'more', page: 'more' },
  ];

  return (
    <div className="flex flex-col h-screen w-full border-r border-gray-800 bg-black sticky top-0">
      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="shrink-0">
          <TwitterLogo size="lg" className="text-white" />
        </div>
        <LanguageSelector />
      </div>

      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.page}>
              <Button
                variant="ghost"
                className={`w-full justify-center md:justify-start text-xl py-6 px-4 rounded-full hover:bg-gray-900 ${item.current ? 'font-bold' : 'font-normal'
                  } text-white hover:text-white transition-all h-auto min-h-[56px]`}
                onClick={() => onNavigate?.(item.page)}
              >
                <div className="relative shrink-0">
                  <item.icon className="md:mr-4 h-7 w-7" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 md:hidden bg-blue-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      3
                    </span>
                  )}
                </div>
                <span className="hidden md:inline truncate lg:whitespace-normal lg:text-left min-w-0 overflow-hidden text-ellipsis">
                  {item.name}
                </span>
                {item.badge && (
                  <span className="hidden md:flex ml-auto bg-blue-500 text-white text-xs rounded-full h-5 w-5 items-center justify-center shrink-0">
                    3
                  </span>
                )}
              </Button>
            </li>
          ))}
        </ul>

        <div className="mt-4 px-2">
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-full text-lg flex justify-center items-center">
            <span className="hidden md:inline">{t('post')}</span>
            <span className="md:hidden">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current text-white"><g><path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H13V11h-2V9.5h2V8h1.5v1.5H16V11zM1 22h4y3 3 0 0 1 0 6H1v-6z"></path></g></svg>
            </span>
          </Button>
        </div>
        {user && (
          <div className="mt-6 px-4 hidden md:block">
            <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{tSub('plan')}: {user.subscriptionPlan ? tSub(`plan_${user.subscriptionPlan.toLowerCase()}`) : tSub('default_plan')}</span>
                <span className="text-[10px] text-blue-400 font-mono">
                  {user.tweetCount || 0}/{user.subscriptionPlan === 'Gold' ? '∞' : (user.subscriptionPlan === 'Silver' ? '5' : (user.subscriptionPlan === 'Bronze' ? '3' : '1'))}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{
                    width: `${user.subscriptionPlan === 'Gold' ? 0 : Math.min(100, ((user.tweetCount || 0) / (user.subscriptionPlan === 'Silver' ? 5 : (user.subscriptionPlan === 'Bronze' ? 3 : 1))) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-center md:justify-start p-3 rounded-full hover:bg-gray-900 overflow-hidden"
              >
                <Avatar className="h-10 w-10 md:mr-3 shrink-0">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block flex-1 text-left truncate">
                  <div className="text-white font-semibold truncate">{user.displayName}</div>
                  <div className="text-gray-400 text-sm truncate">@{user.username}</div>
                </div>
                <MoreHorizontal className="hidden md:block h-5 w-5 text-gray-400 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black border-gray-800">
              <DropdownMenuItem className="text-white hover:bg-gray-900">
                <Settings className="mr-2 h-4 w-4" />
                {t('settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem
                className="text-white hover:bg-gray-900"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')} @{user.username}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}