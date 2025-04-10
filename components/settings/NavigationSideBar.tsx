import React from "react";
import { MessageSquare, Sun, Moon, LogOut, TrendingUp } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface NavigationSideBarProps {
  activePanel: "chat" | "funil";
  setActivePanel: (panel: "chat" | "funil") => void;
  isMobile: boolean;
  isLightTheme: boolean;
  toggleTheme: () => void;
  handleLogout: () => void;
}

export default function NavigationSideBar({
  activePanel,
  setActivePanel,
  isMobile,
  isLightTheme,
  toggleTheme,
  handleLogout,
}: NavigationSideBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isOnFunilPage = pathname === "/funil";

  const handleNavigation = (panel: "chat" | "funil") => {
    if (panel === "funil") {
      router.push("/funil");
    } else {
      // If already on home page, use the panel toggle
      if (pathname === "/") {
        setActivePanel("chat");
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div
      className={`${isLightTheme ? "bg-gray-200" : "bg-[#111b21]"} ${
        isMobile
          ? "fixed bottom-0 left-0 right-0 h-16 flex-row border-t"
          : "w-16 h-full flex-col border-r"
      } flex ${isLightTheme ? "border-gray-300" : "border-[#222d34]"} z-10`}
    >

      <div
        className={`flex ${
          isMobile ? "flex-row justify-around items-center w-full" : "flex-col items-center mt-6 space-y-6"
        }`}
      >
        <button
          onClick={() => handleNavigation("chat")}
          className={`p-3 rounded-full transition-colors ${
            !isOnFunilPage
              ? isLightTheme
                ? "bg-blue-500 text-white"
                : "bg-[#00a884] text-white"
              : isLightTheme
              ? "text-gray-700 hover:bg-gray-300"
              : "text-[#aebac1] hover:bg-[#202c33]"
          }`}
          title="Chat"
        >
          <MessageSquare size={24} />
        </button>

        <button
          onClick={() => handleNavigation("funil")}
          className={`p-3 rounded-full transition-colors ${
            isOnFunilPage
              ? isLightTheme
                ? "bg-blue-500 text-white"
                : "bg-[#00a884] text-white"
              : isLightTheme
              ? "text-gray-700 hover:bg-gray-300"
              : "text-[#aebac1] hover:bg-[#202c33]"
          }`}
          title="Funil"
        >
          <TrendingUp size={24} />
        </button>

        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full transition-colors ${
            isLightTheme
              ? "text-gray-700 hover:bg-gray-300"
              : "text-[#aebac1] hover:bg-[#202c33]"
          }`}
          title={isLightTheme ? "Dark Mode" : "Light Mode"}
        >
          {isLightTheme ? <Moon size={24} /> : <Sun size={24} />}
        </button>

        <button
          onClick={handleLogout}
          className={`p-3 rounded-full transition-colors ${
            isLightTheme
              ? "text-gray-700 hover:bg-gray-300"
              : "text-[#aebac1] hover:bg-[#202c33]"
          }`}
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
}
