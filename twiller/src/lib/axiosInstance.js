import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && window.navigator && window.navigator.maxTouchPoints > 0) {
    config.headers["X-Is-Touch-Device"] = "true";
  }
  return config;
});

export default axiosInstance;
