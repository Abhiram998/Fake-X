"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MoreHorizontal,
  Camera,
  Bell,
  Zap,
  ShieldCheck,
  Smartphone,
  Globe,
  Monitor
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import TweetCard from "./TweetCard";
import { Card, CardContent } from "./ui/card";
import Editprofile from "./Editprofile";
import axiosInstance from "@/lib/axiosInstance";
import { requestNotificationPermission, showNotification, keywords } from "@/lib/notificationService";
import { Label } from "./ui/label";

interface Tweet {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  comments: number;
  liked?: boolean;
  retweeted?: boolean;
  image?: string;
}
const tweets: Tweet[] = [
  {
    id: "1",
    author: {
      id: "1",
      username: "elonmusk",
      displayName: "Elon Musk",
      avatar:
        "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content:
      "Just had an amazing conversation about the future of AI. The possibilities are endless!",
    timestamp: "2h",
    likes: 1247,
    retweets: 324,
    comments: 89,
    liked: false,
    retweeted: false,
  },
  {
    id: "2",
    author: {
      id: "1",
      username: "sarahtech",
      displayName: "Sarah Johnson",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: false,
    },
    content:
      "Working on some exciting new features for our app. Can't wait to share what we've been building! 🚀",
    timestamp: "4h",
    likes: 89,
    retweets: 23,
    comments: 12,
    liked: true,
    retweeted: false,
  },
  {
    id: "3",
    author: {
      id: "4",
      username: "designguru",
      displayName: "Alex Chen",
      avatar:
        "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content:
      "The new design system is finally complete! It took 6 months but the results are incredible. Clean, consistent, and accessible.",
    timestamp: "6h",
    likes: 456,
    retweets: 78,
    comments: 34,
    liked: false,
    retweeted: true,
    image:
      "https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];
export default function ProfilePage() {
  const { user, toggleNotifications } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const t = useTranslations('Profile');

  const [tweets, setTweets] = useState<any>([]);
  const [loading, setloading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const { getLoginHistory } = useAuth();
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchTweets = async () => {
    try {
      setloading(true);
      const res = await axiosInstance.get("/post");
      setTweets(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      setHistoryLoading(true);
      const history = await getLoginHistory();
      setLoginHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (!user) return null;

  // Filter tweets by current user
  const userTweets = tweets.filter(
    (tweet: any) => tweet.author._id === user._id
  );

  const handleToggleNotifications = async () => {
    if (!user) return;
    setToggleLoading(true);
    await toggleNotifications(!user.notificationEnabled);
    setToggleLoading(false);
  };


  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="flex items-center px-4 py-2 sm:py-3 space-x-4 sm:space-x-8">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-gray-900 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">{user.displayName}</h1>
            <p className="text-xs sm:text-sm text-gray-400">{t('posts_count', { count: userTweets.length })}</p>
          </div>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70"
          >
            <Camera className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-black">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback className="text-2xl">
                {user.displayName[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-2 right-2 p-2 rounded-full bg-black/70 hover:bg-black/90"
            >
              <Camera className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="flex justify-end p-4">
          <Button
            variant="outline"
            className="border-gray-600 text-white bg-gray-950 font-semibold rounded-full px-6"
            onClick={() => setShowEditModal(true)}
          >
            {t('edit_profile')}
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 mt-12">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white truncate lg:whitespace-normal overflow-anywhere">
              {user.displayName}
            </h1>
            <p className="text-gray-400 truncate">@{user.username}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-gray-900 shrink-0"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </Button>
        </div>

        {user.bio && (
          <p className="text-white mb-3 leading-relaxed overflow-anywhere wrap-safe">{user.bio}</p>
        )}

        <div className="flex items-center space-x-4 text-gray-400 text-sm mb-3">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{user.location ? user.location : "Earth"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <LinkIcon className="h-4 w-4" />
            <span className="text-blue-400">
              {user.website ? user.website : "example.com"}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              {t('joined')}{" "}
              {user.joinedDate &&
                new Date(user.joinedDate).toLocaleDateString("en-us", {
                  month: "long",
                  year: "numeric",
                })}
            </span>
          </div>
        </div>

        {/* Notification Toggle */}
        <div className="flex flex-col space-y-4 p-4 bg-gray-900/40 rounded-2xl border border-gray-800 mt-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white text-base font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                {t('keyword_notifications')}
              </Label>
              <p className="text-sm text-gray-400">
                {t('watching_for')}: {keywords.map(k => <span key={k} className="text-blue-300 font-medium mx-1">#{k}</span>)}
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              disabled={toggleLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${user.notificationEnabled ? "bg-blue-500" : "bg-gray-700"
                } ${toggleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${user.notificationEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </div>
          {user.notificationEnabled && (
            <div className="pt-2 border-t border-gray-800/50">
              <p className="text-[10px] text-gray-500 italic">
                Mobile Tip: For background alerts, use &quot;Add to Home Screen&quot; (iOS) or keep the tab active (Android).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto bg-transparent border-b border-gray-800 rounded-none h-auto no-scrollbar">
          <TabsTrigger
            value="posts"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t('posts')}
          </TabsTrigger>
          <TabsTrigger
            value="replies"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t('replies')}
          </TabsTrigger>
          <TabsTrigger
            value="highlights"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t('highlights')}
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t('articles')}
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t('media')}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <div className="divide-y divide-gray-800">
            {loading ? (
              <Card className="bg-black border-none">
                <CardContent className="py-12 text-center">
                  <div className="text-gray-400">
                    <h3 className="text-2xl font-bold mb-2">
                      {t('no_posts_title')}
                    </h3>
                    <p>{t('no_posts_desc')}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              userTweets.map((tweet: any) => (
                <TweetCard key={tweet._id} tweet={tweet} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <Card className="bg-black border-none">
            <CardContent className="py-12 text-center">
              <div className="text-gray-400">
                <h3 className="text-2xl font-bold mb-2">
                  {t('no_posts_title')}
                </h3>
                <p>{t('no_posts_desc')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights" className="mt-0">
          <Card className="bg-black border-none">
            <CardContent className="py-12 text-center">
              <div className="text-gray-400">
                <h3 className="text-2xl font-bold mb-2">
                  {t('highlights')}
                </h3>
                <p>{t('no_posts_desc')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles" className="mt-0">
          <Card className="bg-black border-none">
            <CardContent className="py-12 text-center">
              <div className="text-gray-400">
                <h3 className="text-2xl font-bold mb-2">
                  {t('articles')}
                </h3>
                <p>{t('no_posts_desc')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <Card className="bg-black border-none">
            <CardContent className="py-12 text-center">
              <div className="text-gray-400">
                <h3 className="text-2xl font-bold mb-2">
                  {t('media')}
                </h3>
                <p>{t('no_posts_desc')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-2 mb-6">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Login History</h2>
            </div>

            <div className="space-y-3">
              {historyLoading ? (
                <div className="py-10 text-center text-gray-400">Loading history...</div>
              ) : loginHistory.length === 0 ? (
                <div className="py-10 text-center text-gray-400">No login records found.</div>
              ) : (
                loginHistory.map((login: any) => (
                  <div
                    key={login._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-900/40 border border-gray-800 rounded-xl hover:bg-gray-900 transition-colors gap-4 sm:gap-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-800 rounded-lg shrink-0">
                        {login.device === 'mobile' ? (
                          <Smartphone className="h-5 w-5 text-blue-400" />
                        ) : login.device === 'desktop' ? (
                          <Monitor className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Globe className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">
                          {login.browser || 'Unknown Browser'} on {login.os || 'Unknown OS'} <span className="text-gray-400 font-normal">({login.device})</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          IP: {login.ip}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 ml-14 sm:ml-0">
                      <p className="text-sm text-gray-400">
                        {login.loginTime ? new Date(login.loginTime).toLocaleDateString() : 'Unknown Date'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {login.loginTime ? new Date(login.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="text-[10px] text-gray-600 mt-8 uppercase tracking-widest text-center">
              End-to-End Session Transparency
            </p>
          </div>
        </TabsContent>
      </Tabs>
      <Editprofile
        isopen={showEditModal}
        onclose={() => setShowEditModal(false)}
      />
    </div>
  );
}
