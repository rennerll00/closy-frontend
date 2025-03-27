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
}

interface SidePanelProps {
  showLeftPanel: boolean;
  handleOpenStoreLink: () => void;
  isLoading: boolean;
  uniqueUserPhones: string[];
  filteredChats: ChatRecord[];
  userPhoneParam: string;
  handleChatSelect: (uPhone: string) => void;
  getLastMessageInfo: (convo: ConversationEntry[]) => { lastMsg: string; lastTs: number };
  formatTimestamp: (ts: number) => string;
}

export default function SidePanel({
  showLeftPanel,
  handleOpenStoreLink,
  isLoading,
  uniqueUserPhones,
  filteredChats,
  userPhoneParam,
  handleChatSelect,
  getLastMessageInfo,
  formatTimestamp,
}: SidePanelProps) {
  // Local state for searching by phone or last message
  const [searchQuery, setSearchQuery] = useState("");

  if (!showLeftPanel) return null;

  // Filter chats based on the search query
  const searchedChats = uniqueUserPhones
    .map((uPhone) => {
      const chat = filteredChats.find((c) => c.phone === uPhone);
      if (!chat) return null;

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
    <div className="flex h-full flex-col bg-[#111b21] border-r border-[#222d34]">
      {/* Header with search + open link button */}
      <div className="p-2 bg-[#202c33]">
        {/* Search Bar */}
        <div className="relative mb-2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-[#8696a0]" />
          </div>
          <input
            placeholder="Busque por nome ou mensagem"
            className="w-full bg-[#202c33] border-none pl-10 py-2 text-[#d1d7db] placeholder-[#8696a0] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* "Abrir link" button */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleOpenStoreLink}
            className="text-sm text-[#8696a0] hover:bg-[#374248] hover:text-[#e9edef] px-3 py-1 rounded-md"
          >
            Abrir link
          </button>
        </div>
      </div>

      {/* Conversation List (scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Show loader if fetching data
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#00a884]" />
          </div>
        ) : searchedChats.length > 0 ? (
          searchedChats.map((chat) => {
            const { lastMsg, lastTs } = getLastMessageInfo(chat.conversation);
            const timeLabel = lastTs ? formatTimestamp(lastTs) : "";
            const displayName = chat.phone || "";

            return (
              <div
                key={chat.id}
                className={`cursor-pointer transition-colors hover:bg-[#202c33] px-3 py-3 border-t border-[#222d34] ${userPhoneParam === chat.phone ? "bg-[#2a3942]" : ""
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
                      <h3 className="font-medium text-[#e9edef] truncate">
                        {displayName}
                      </h3>
                      {timeLabel && (
                        <span className="text-xs text-[#8696a0] ml-2">
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
                        <p className="text-sm text-[#8696a0] truncate">
                          {lastMsg || "Sem mensagens"}
                        </p>
                    </div>
                  </div>

                  {/* Show "Interv." badge if chat.intervention is true */}
                  {chat.intervention && (
                    <span className="ml-2 text-xs bg-[#f6213f] text-white px-2 py-1 rounded">
                      Interv.
                    </span>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-center text-[#8696a0]">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
