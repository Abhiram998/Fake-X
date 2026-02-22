"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "./firebase";
import axiosInstance from "../lib/axiosInstance";
import { subscribeUserToPush, unsubscribeUserFromPush, requestNotificationPermission } from "../lib/notificationService";
import toast from "react-hot-toast";

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  joinedDate: string;
  email: string;
  website: string;
  location: string;
  notificationEnabled: boolean;
  subscriptionPlan?: string;
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  tweetCount: number;
  preferredLanguage?: string;
  phone?: string;
  mobile?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    username: string,
    displayName: string,
    mobile: string
  ) => Promise<void>;
  updateProfile: (profileData: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    avatar: string;
    mobile?: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  googlesignin: () => void;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateTweetCount: (newCount: number) => void;
  requestLanguageChange: (language: string) => Promise<{ message: string }>;
  verifyLanguageChange: (otp: string) => Promise<void>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  getLoginHistory: () => Promise<any[]>;
  pendingOtpInfo: { email: string } | null;
  clearPendingOtp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOtpInfo, setPendingOtpInfo] = useState<{ email: string } | null>(null);
  useEffect(() => {
    // Check local storage first for persistence
    const savedUser = localStorage.getItem("twitter-user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    // Secondary check for Firebase session
    const unsubcribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        try {
          // Check if we need to force an OTP check (e.g., first time this firebase session is seen)
          const needsCheck = !localStorage.getItem("twitter-user");
          const res = await axiosInstance.get("/loggedinuser", {
            params: { email: firebaseUser.email, isLogin: needsCheck },
          });

          if (res.data.otpRequired) {
            // If we are in a background sync and OTP is required, 
            // we DO NOT set the user. The login/googlesignin functions will handle the modal.
            console.log("🔒 Background OTP check required, skipping auto-login.");
            setPendingOtpInfo({ email: firebaseUser.email });
            setIsLoading(false);
            return;
          }

          if (res.data && res.data.email) {
            setUser(res.data);
            localStorage.setItem("twitter-user", JSON.stringify(res.data));
          }
        } catch (err) {
          console.log("Failed to fetch user after Firebase login:", err);
        }
      } else if (!localStorage.getItem("twitter-user")) {
        // Only clear if we don't have a backend session
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubcribe();
  }, []);

  // Sync locale with preferredLanguage
  useEffect(() => {
    if (user?.preferredLanguage) {
      document.cookie = `NEXT_LOCALE=${user.preferredLanguage}; path=/; max-age=31536000`;
    }
  }, [user?.preferredLanguage]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/login", { email, password });

      if (res.data.otpRequired) {
        toast.success(res.data.message);
        setPendingOtpInfo({ email: res.data.email });
        return res.data;
      }

      if (res.data) {
        setUser(res.data);
        localStorage.setItem("twitter-user", JSON.stringify(res.data));

        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (fbErr) {
          console.log("Firebase sync skipped or failed, using backend session.");
        }
        return res.data;
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Login failed";
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLoginOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/verify-login-otp", { email, code: otp });
      if (res.data) {
        setUser(res.data);
        localStorage.setItem("twitter-user", JSON.stringify(res.data));
        toast.success("Login successful!");
      }
    } catch (error: any) {
      const message = error.response?.data?.error || "Invalid OTP";
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getLoginHistory = async () => {
    if (!user) return [];
    try {
      const res = await axiosInstance.get("/login-history", {
        params: { userId: user._id }
      });
      return res.data;
    } catch (err) {
      console.error("Failed to fetch login history:", err);
      return [];
    }
  };

  const verifyLanguageChange = async (otp: string) => {
    if (!user) throw new Error("Not logged in");
    const res = await axiosInstance.post("/verify-language-change", {
      email: user.email,
      code: otp,
    });
    if (res.data.preferredLanguage) {
      const updatedUser = { ...user, preferredLanguage: res.data.preferredLanguage };
      setUser(updatedUser);
      localStorage.setItem("twitter-user", JSON.stringify(updatedUser));
      toast.success("Language updated successfully!");
      // Set cookie explicitly before reload to ensure middleware picks it up immediately
      document.cookie = `NEXT_LOCALE=${res.data.preferredLanguage}; path=/; max-age=31536000`;
      // Refresh to apply locale and update middleware-driven translations
      window.location.reload();
    }
  };

  const signup = async (
    email: string,
    password: string,
    username: string,
    displayName: string,
    mobile: string
  ) => {
    setIsLoading(true);
    try {
      // Step 1: Create in Firebase
      const usercred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = usercred.user;

      // Step 2: Register in MongoDB
      const newuser: any = {
        username,
        displayName,
        mobile,
        avatar: user.photoURL || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
        email: user.email,
        password: password, // Save initial password to MongoDB as well
      };

      const res = await axiosInstance.post("/register", newuser);
      if (res.data) {
        setUser(res.data);
        localStorage.setItem("twitter-user", JSON.stringify(res.data));
      }
    } catch (error: any) {
      console.error("Signup Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setPendingOtpInfo(null);
    await signOut(auth);
    localStorage.removeItem("twitter-user");
  };
  const updateProfile = async (profileData: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    avatar: string;
    mobile?: string;
  }) => {
    if (!user) return;

    setIsLoading(true);
    // Mock API call - in real app, this would call an API
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    const updatedUser: User = {
      ...user,
      ...profileData,
    };
    const res = await axiosInstance.patch(
      `/userupdate/${user.email}`,
      updatedUser
    );
    if (res.data) {
      setUser(updatedUser);
      localStorage.setItem("twitter-user", JSON.stringify(updatedUser));
    }

    setIsLoading(false);
  };
  const googlesignin = async () => {
    setIsLoading(true);

    try {
      const googleauthprovider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleauthprovider);
      const firebaseuser = result.user;

      if (!firebaseuser?.email) {
        throw new Error("No email found in Google account");
      }

      let userData;

      try {
        const res = await axiosInstance.get("/loggedinuser", {
          params: { email: firebaseuser.email, isLogin: true },
        });
        userData = res.data;
      } catch (err: any) {
        const newuser: any = {
          username: firebaseuser.email.split("@")[0],
          displayName: firebaseuser.displayName || "User",
          avatar: firebaseuser.photoURL || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
          email: firebaseuser.email,
          mobile: "0000000000",
          isLogin: true
        };

        const registerRes = await axiosInstance.post("/register", newuser);
        userData = registerRes.data;
      }

      if (userData?.otpRequired) {
        toast.success(userData.message);
        setPendingOtpInfo({ email: userData.email });
        return userData; // Trigger OTP modal
      }

      if (userData) {
        setUser(userData);
        localStorage.setItem("twitter-user", JSON.stringify(userData));
      } else {
        throw new Error("Login/Register failed: No user data returned");
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Google login popup closed by user.");
        return;
      }
      console.error("Google Sign-In Error:", error);
      toast.error(error.response?.data?.message || error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        updateProfile,
        logout,
        isLoading,
        googlesignin,
        toggleNotifications: async (enabled: boolean) => {
          if (!user) return;
          try {
            if (enabled) {
              const granted = await requestNotificationPermission();
              if (granted) {
                await subscribeUserToPush(user._id);
                toast.success("Notifications enabled!");
              } else {
                toast.error("Notification permission denied.");
                return; // Don't enable if permission denied
              }
            } else {
              await unsubscribeUserFromPush(user._id);
              toast.success("Notifications disabled.");
            }

            const res = await axiosInstance.patch(`/userupdate/${user.email}`, {
              notificationEnabled: enabled,
            });
            if (res.data) {
              const updatedUser = { ...user, notificationEnabled: enabled };
              setUser(updatedUser);
              localStorage.setItem("twitter-user", JSON.stringify(updatedUser));
            }
          } catch (err: any) {
            console.error("❌ Failed to update notifications preference:", err);
            const errorMessage = err.response?.data?.error || err.message || "Failed to update notification settings.";
            toast.error(errorMessage);
          }
        },
        refreshUser: async () => {
          if (!user?.email) return;
          try {
            const res = await axiosInstance.get("/loggedinuser", {
              params: { email: user.email },
            });
            if (res.data) {
              setUser(res.data);
              localStorage.setItem("twitter-user", JSON.stringify(res.data));
            }
          } catch (err) {
            console.error("Failed to refresh user data:", err);
          }
        },
        updateTweetCount: (newCount: number) => {
          if (!user) return;
          const updatedUser = { ...user, tweetCount: newCount };
          setUser(updatedUser);
          localStorage.setItem("twitter-user", JSON.stringify(updatedUser));
        },
        requestLanguageChange: async (language: string) => {
          if (!user) throw new Error("Not logged in");
          const res = await axiosInstance.post("/request-language-change", {
            email: user.email,
            language: language,
          });
          return res.data;
        },
        verifyLanguageChange,
        verifyLoginOtp,
        getLoginHistory,
        pendingOtpInfo,
        clearPendingOtp: () => setPendingOtpInfo(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
