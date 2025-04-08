import React from "react";
import { MessageSquare, PieChart, Sun, Moon, LogOut } from "lucide-react";

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
          onClick={() => setActivePanel("chat")}
          className={`p-3 rounded-full transition-colors ${
            activePanel === "chat"
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
          onClick={() => setActivePanel("funil")}
          className={`p-3 rounded-full transition-colors ${
            activePanel === "funil"
              ? isLightTheme
                ? "bg-blue-500 text-white"
                : "bg-[#00a884] text-white"
              : isLightTheme
              ? "text-gray-700 hover:bg-gray-300"
              : "text-[#aebac1] hover:bg-[#202c33]"
          }`}
          title="Funil"
        >
          <PieChart size={24} />
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

        {!isMobile && (
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
        )}
      </div>
    </div>
  );
}
