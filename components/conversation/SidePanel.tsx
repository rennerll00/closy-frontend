import React, { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface BotMessage {
  choice?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: string | string[] | any;
  "in-progress": boolean;
  "progress-message"?: string;
  timestamp?: number;
  externalId?: string;
}

interface ConversationEntry {
  user?: string;
  type?: string;
  timestamp?: number;
  externalId?: string;
  bot?: BotMessage;
}

interface ChatRecord {
  id: string;
  user_id: string;
  phone: string;
  email?: string;
  recipient: string;
  conversation: ConversationEntry[];
  intervention?: boolean;
  seller_name?: string;
  is_gift_mom?: boolean;
}

interface SidePanelProps {
  showLeftPanel: boolean;
  isLoading: boolean;
  uniqueUserPhones: string[];
  filteredChats: ChatRecord[];
  userPhoneParam: string;
  handleChatSelect: (uPhone: string) => void;
  getLastMessageInfo: (convo: ConversationEntry[]) => { lastMsg: string; lastTs: number };
  formatTimestamp: (ts: number) => string;
  isLightTheme: boolean;
}

export default function SidePanel({
  showLeftPanel,
  isLoading,
  uniqueUserPhones,
  filteredChats,
  userPhoneParam,
  handleChatSelect,
  getLastMessageInfo,
  formatTimestamp,
  isLightTheme,
}: SidePanelProps) {
  // Local state for searching by phone or last message
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyGiftMom, setShowOnlyGiftMom] = useState(false);

  if (!showLeftPanel) return null;

  // Filter chats based on the search query
  const searchedChats = uniqueUserPhones
    .map((uPhone) => {
      const chat = filteredChats.find((c) => c.phone === uPhone);
      if (!chat) return null;

      // Filter by gift_mom if enabled
      if (showOnlyGiftMom && !chat.is_gift_mom) {
        return null;
      }

      // Extract last message text to match against search
      const { lastMsg } = getLastMessageInfo(chat.conversation);
      const phoneLower = (chat.phone || "").toLowerCase();
      const lastMsgLower = (lastMsg || "").toLowerCase();
      const queryLower = searchQuery.toLowerCase();

      // If either the phone or last message contains the query, keep the chat
      if (phoneLower.includes(queryLower) || lastMsgLower.includes(queryLower)) {
        return chat;
      }
      return null;
    })
    .filter(Boolean) as ChatRecord[];

  // Sort chats: chats with intervention come first; then by last message timestamp descending.
  searchedChats.sort((a, b) => {
    if (a.intervention && !b.intervention) return -1;
    if (!a.intervention && b.intervention) return 1;
    const { lastTs: aTs } = getLastMessageInfo(a.conversation);
    const { lastTs: bTs } = getLastMessageInfo(b.conversation);
    return (bTs || 0) - (aTs || 0);
  });

  return (
    <div className={`${isLightTheme ? "bg-white border-r border-gray-300" : "bg-[#111b21] border-r border-[#222d34]"} flex h-full flex-col`}>
      {/* Header with search + open link button */}
      <div className={`${isLightTheme ? "bg-gray-100" : "bg-[#202c33]"} p-2`}>
        {/* Search Bar */}
        <div className="relative mb-2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className={`${isLightTheme ? "text-gray-600" : "text-[#8696a0]"} h-4 w-4`} />
          </div>
          <input
            placeholder="Busque por nome ou mensagem"
            className={`${isLightTheme ? "bg-gray-100 text-black placeholder-gray-500" : "bg-[#202c33] text-[#d1d7db] placeholder-[#8696a0]"} w-full border-none pl-10 py-2 rounded-lg`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowOnlyGiftMom(!showOnlyGiftMom)}
            className={`${
              isLightTheme
                ? `text-sm ${showOnlyGiftMom ? "bg-pink-100 text-pink-700" : "text-black hover:bg-gray-200"}`
                : `text-sm ${showOnlyGiftMom ? "bg-pink-900 text-pink-200" : "text-[#8696a0] hover:bg-[#374248]"}`
            } px-3 py-1 rounded-md w-full flex items-center justify-center transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            {showOnlyGiftMom ? "Mostrar Todos" : "Filtrar Presente"}
          </button>
        </div>
      </div>

      {/* Conversation List (scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Show loader if fetching data
          <div className="flex items-center justify-center p-4">
            <Loader2 className={`${isLightTheme ? "text-gray-600" : "text-[#00a884]"} h-8 w-8 animate-spin`} />
          </div>
        ) : searchedChats.length > 0 ? (
          searchedChats.map((chat) => {
            const { lastMsg, lastTs } = getLastMessageInfo(chat.conversation);
            const timeLabel = lastTs ? formatTimestamp(lastTs) : "";
            const displayName = chat.phone || "";

            return (
              <div
                key={chat.id}
                className={`cursor-pointer transition-colors hover:${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} px-3 py-3 border-t ${isLightTheme ? "border-gray-300" : "border-[#222d34]"} ${userPhoneParam === chat.phone ? (isLightTheme ? "bg-gray-300" : "bg-[#2a3942]") : ""
                  }`}
                onClick={() => handleChatSelect(chat.phone)}
              >
                <div className="flex items-start gap-3">
                  <Image
                    src="/images/default.png"
                    alt="avatar"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`${isLightTheme ? "text-black" : "text-[#e9edef]"} font-medium truncate`}>
                        {displayName}
                      </h3>
                      {timeLabel && (
                        <span className={`${isLightTheme ? "text-gray-500" : "text-[#8696a0]"} text-xs ml-2`}>
                          {timeLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 px-2 py-0.5 rounded-full text-xs text-white bg-gray-600">
                        <p className="text-sm truncate">
                          {chat.seller_name || "Vendedor"}
                        </p>
                      </div>
                      <p className={`${isLightTheme ? "text-gray-500" : "text-[#8696a0]"} text-sm truncate`}>
                        {lastMsg || "Sem mensagens"}
                      </p>
                      {chat.is_gift_mom && (
                        <div className="mr-2 px-2 py-0.5 rounded-full text-xs text-white bg-pink-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                          <span>Mãe</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show "Interv." badge if chat.intervention is true */}
                  {chat.intervention && (
                    <span className={`${isLightTheme ? "bg-red-500" : "bg-[#f6213f]"} text-white text-xs px-2 py-1 rounded ml-2`}>
                      Interv.
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <p className={`${isLightTheme ? "text-gray-600" : "text-[#8696a0]"} text-center`}>No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
