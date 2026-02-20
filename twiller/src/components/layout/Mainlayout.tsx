"use client";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import LoadingSpinner from "../loading-spinner";
import Sidebar from "./Sidebar";
import RightSidebar from "./Rightsidebar";
import ProfilePage from "../ProfilePage";

import MobileNav from "./MobileNav";

const Mainlayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");

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

  // If user is not logged in → show children (like login/signup pages)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center w-full overflow-x-hidden">
      {/* Sidebar - hidden on mobile, narrow on tablets, wide on desktop */}
      <div className="hidden xs:flex w-16 sm:w-20 md:w-64 border-r border-gray-800 flex-shrink-0">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[600px] border-x border-gray-800 relative pb-16 sm:pb-0">
        {currentPage === "profile" ? <ProfilePage /> : children}
      </main>

      {/* Right Sidebar - only on desktop */}
      <div className="hidden lg:block w-80 p-4 sticky top-0 h-screen">
        <RightSidebar />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
};

export default Mainlayout;
