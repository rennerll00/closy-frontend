"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut } from "lucide-react";

// Components
import FunilPanel from "@/components/settings/FunilPanel";
import NavigationSideBar from "@/components/settings/NavigationSideBar";

// API functions
import { logout } from "@/lib/api";

export default function FunilPage() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      // Get seller ID from token
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setSellerId(tokenData.sellerId || "default-seller");
        console.log("Using seller ID from token:", tokenData.sellerId);
      } catch (error) {
        console.error("Error parsing token:", error);
        setSellerId("default-seller");
      }
    }
  }, [router]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Theme state and toggle
  const [isLightTheme, setIsLightTheme] = useState(true);
  const toggleTheme = () => setIsLightTheme((prev) => !prev);

  // Placeholder for active panel - always funil on this page
  const [activePanel, setActivePanel] = useState<"chat" | "funil">("funil");

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading state while fetching sellerId
  if (!sellerId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isLightTheme ? "bg-gray-50 text-black" : "bg-[#0b141a] text-[#e9edef]"} flex flex-col h-screen w-screen overflow-hidden`}>
      {/* TOP NAV BAR (only on desktop) */}
      {!isMobile && (
        <div className="relative flex items-center justify-between p-4 border-b border-[#222d34] bg-[#202c33] text-white">
          <div className="w-24"></div> {/* Empty div for balance */}
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={100}
            height={40}
            className="mx-auto cursor-pointer object-contain"
            onClick={() => router.replace("/")}
            unoptimized
          />
          <div className="w-24 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-md bg-[#3a4a54] hover:bg-[#4a5c66] text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT: Navigation + FunilPanel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation sidebar */}
        <NavigationSideBar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          isMobile={isMobile}
          isLightTheme={isLightTheme}
          toggleTheme={toggleTheme}
          handleLogout={handleLogout}
        />

        {/* Content area */}
        <div className={`flex-1 ${isMobile ? "pb-16" : ""}`}>
          <FunilPanel
            isLightTheme={isLightTheme}
            isMobile={isMobile}
            sellerId={sellerId}
          />
        </div>
      </div>
    </div>
  );
}
