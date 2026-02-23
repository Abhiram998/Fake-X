"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "../loading-spinner";
import Sidebar from "./Sidebar";
import RightSidebar from "./Rightsidebar";
import ProfilePage from "../ProfilePage";
import SubscriptionPage from "../SubscriptionPage";
import Feed from "../Feed";
import MobileNav from "./MobileNav";
import MobileHeader from "./MobileHeader";
import { NavigationProvider, useNavigation } from "@/context/NavigationContext";

function MainlayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { currentPage, navigate } = useNavigation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-4xl font-bold mb-4">X</div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col sm:flex-row justify-center w-full overflow-x-hidden">
      {/* Mobile Header - Visible only on mobile */}
      <MobileHeader currentPage={currentPage} onNavigate={navigate} />

      {/* Sidebar - Visible only on screens larger than mobile */}
      <div className="hidden sm:flex w-20 md:w-64 border-r border-gray-800 flex-shrink-0">
        <Sidebar currentPage={currentPage} onNavigate={navigate} />
      </div>

      <main className="flex-1 w-full max-w-[600px] border-x border-gray-800 relative pb-16 sm:pb-0 font-sans">
        {currentPage === "profile" ? (
          <ProfilePage />
        ) : currentPage === "subscriptions" ? (
          <SubscriptionPage />
        ) : (
          <Feed />
        )}
      </main>

      {/* Right Sidebar - Visible only on large screens */}
      <div className="hidden lg:block w-80 p-4 sticky top-0 h-screen">
        <RightSidebar />
      </div>

      {/* Mobile Bottom Navigation - Visible only on mobile */}
      <MobileNav currentPage={currentPage} onNavigate={navigate} />
    </div>
  );
}

const Mainlayout = ({ children }: { children: React.ReactNode }) => (
  <NavigationProvider>
    <MainlayoutInner>{children}</MainlayoutInner>
  </NavigationProvider>
);

export default Mainlayout;
