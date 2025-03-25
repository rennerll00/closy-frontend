"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import React from "react";

// Components
import SidePanel from "@/components/conversation/SidePanel";
import ChatPanel from "@/components/conversation/ChatPanel";

// API functions
import { getChats, sendDirectMessage, toggleIntervention } from "@/lib/api";

// --- Interfaces ---
interface BotImageMessage {
  type: "image";
  caption?: string;
  imageUrl: string;
}

interface BotMessage {
  choice?: string;
  message: string | string[] | BotImageMessage | BotImageMessage[];
  "in-progress": boolean;
  "progress-message"?: string;
  timestamp?: number;
  externalId?: string;
}

export interface ConversationEntry {
  user?: string;
  type?: string;
  timestamp?: number;
  externalId?: string;
  bot?: BotMessage;
}

export interface ChatRecord {
  id: string;
  user_id: string;
  phone: string;
  email?: string;
  recipient: string;
  conversation: ConversationEntry[];
  intervention?: boolean;
}

// --- Constants ---
const choiceMapping: { [key: string]: string } = {
  GREETING: "SAUDAÇÃO",
  INVENTORY_LOOKUP: "CONSULTA_DE_ESTOQUE",
  INTENT_SUMMARY_VARIANTS: "RESUMO_DE_INTENÇÃO_VARIANTES",
  PRODUCT_MORE_IMAGES: "MAIS_IMAGENS_DO_PRODUTO",
  DELIVERY_PICKUP_OPTIONS: "OPÇÕES_DE_ENTREGA_OU_RETIRADA",
  PAYMENT_OPTIONS: "OPÇÕES_DE_PAGAMENTO",
  CONCLUSION: "CONCLUSÃO",
  HUMAN_INTERVENTION: "INTERVENÇÃO_HUMANA",
  ORDER_STATUS: "STATUS_DO_PEDIDO",
  UNKNOWN_OR_INNAPROPRIATE_OR_BROAD: "DESCONHECIDO_OU_INADEQUADO_OU_AMPLO",
};

// --- Utility Functions ---
function parseEntryIntoSegments(entry: ConversationEntry) {
  const segments: {
    isUser: boolean;
    type: "text" | "image" | "audio";
    text?: string;
    imageUrl?: string;
    choice?: string;
  }[] = [];

  if (entry.user) {
    // user entry
    if (entry.type === "audio") {
      segments.push({ isUser: true, type: "audio", text: entry.user });
    } else {
      segments.push({ isUser: true, type: "text", text: entry.user });
    }
  } else if (entry.bot?.message !== undefined) {
    // bot entry
    const botMsg = entry.bot.message;
    const choice = entry.bot.choice;
    if (typeof botMsg === "string") {
      segments.push({ isUser: false, type: "text", text: botMsg, choice });
    } else if (Array.isArray(botMsg)) {
      botMsg.forEach((item) => {
        if (typeof item === "string") {
          segments.push({ isUser: false, type: "text", text: item, choice });
        } else if (item && typeof item === "object") {
          if (item.type === "image") {
            segments.push({
              isUser: false,
              type: "image",
              text: item.caption || "",
              imageUrl: item.imageUrl,
              choice,
            });
          } else {
            segments.push({
              isUser: false,
              type: "text",
              text: JSON.stringify(item, null, 2),
              choice,
            });
          }
        }
      });
    } else if (typeof botMsg === "object") {
      if (botMsg.type === "image") {
        segments.push({
          isUser: false,
          type: "image",
          text: botMsg.caption || "",
          imageUrl: botMsg.imageUrl,
          choice,
        });
      } else {
        segments.push({
          isUser: false,
          type: "text",
          text: JSON.stringify(botMsg, null, 2),
          choice,
        });
      }
    }
  }

  return segments;
}

function formatTimestamp(ts: number) {
  const now = new Date();
  const date = new Date(ts);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) {
    let hours = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${ampm}`;
  } else if (diffDays < 2) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  } else {
    const dd = date.getDate().toString().padStart(2, "0");
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}

function getLastMessageInfo(convo: ConversationEntry[]) {
  if (!convo || convo.length === 0) return { lastMsg: "", lastTs: 0 };

  const last = convo.filter((entry) => entry.user).pop();
  let raw = "";
  const ts = last?.timestamp || 0;

  if (last?.user) {
    raw = last.user;
  } else if (last?.bot?.message) {
    const b = last.bot.message;
    if (typeof b === "string") {
      raw = b;
    } else if (Array.isArray(b) && b.length > 0) {
      const lastEl = b[b.length - 1];
      if (typeof lastEl === "string") {
        raw = lastEl;
      } else if (typeof lastEl === "object" && "type" in lastEl && lastEl.type === "image") {
        raw = lastEl.caption || "[image]";
      } else {
        raw = "[object]";
      }
    } else if (typeof b === "object" && "type" in b && b.type === "image") {
      raw = b.caption || "[image]";
    } else {
      raw = "[object]";
    }
  }

  const truncated = raw.length > 25 ? raw.slice(0, 25) + "…" : raw;
  return { lastMsg: truncated, lastTs: ts };
}

// --- Main Component ---
export default function AdminPage() {
  const router = useRouter();

  // URL params
  const [phoneParam, setPhoneParam] = useState("");
  const [userPhoneParam, setUserPhoneParam] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPhoneParam(params.get("phone") || "");
    setUserPhoneParam(params.get("user") || "");
  }, []);

  // Chat data
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getChats();
      setChats(data);
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter + sort chats
  const filteredChats = chats.filter((c) => c.recipient === phoneParam);
  filteredChats.sort((a, b) => {
    const aInt = a.intervention ? 1 : 0;
    const bInt = b.intervention ? 1 : 0;
    return bInt - aInt;
  });

  // Distinct user phones
  const uniqueUserPhones = Array.from(new Set(filteredChats.map((c) => c.phone).filter(Boolean)));

  // Active chat
  const activeChat = filteredChats.find((c) => c.phone === userPhoneParam);

  // Scroll to bottom when active chat changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat, isLoading]);

  // Handlers
  const handleChatSelect = (uPhone: string) => {
    setUserPhoneParam(uPhone);
    router.replace(`/?phone=${phoneParam}&user=${uPhone}`);
  };

  const handleBack = () => {
    setUserPhoneParam("");
    router.replace(`/?phone=${phoneParam}`);
  };

  const handleSendMessage = async () => {
    if (!activeChat || !newMessage.trim()) return;

    const trimmedMessage = newMessage.trim();
    const appended = {
      bot: {
        choice: "HUMAN_INTERVENTION",
        message: trimmedMessage,
        "in-progress": false,
      },
      timestamp: Date.now(),
    };

    // update local state
    const updatedChat = {
      ...activeChat,
      conversation: [...activeChat.conversation, appended],
    };
    setChats((prev) => prev.map((c) => (c.id === activeChat.id ? updatedChat : c)));
    setNewMessage("");

    // send to server
    try {
      await sendDirectMessage(phoneParam, userPhoneParam, trimmedMessage);
    } catch (err) {
      console.error("Failed to send direct message:", err);
    }
  };

  const handleToggleIntervention = async () => {
    if (!activeChat) return;
    const newValue = !activeChat.intervention;
    const updatedChat = { ...activeChat, intervention: newValue };
    setChats((prev) => prev.map((c) => (c.id === activeChat.id ? updatedChat : c)));

    try {
      await toggleIntervention(phoneParam, userPhoneParam);
    } catch (err) {
      console.error("Failed to toggle intervention:", err);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
  };

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

  const showLeftPanel = !isMobile || !activeChat;
  const showRightPanel = !isMobile || !!activeChat;

  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenStoreLink = () => {
    const link = `https://api.whatsapp.com/send?phone=${phoneParam}`;
    window.open(link, "_blank");
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b141a] text-[#e9edef] overflow-hidden">
      {/* TOP NAV BAR */}
      <div className="relative text-center p-4 border-b border-[#222d34]">
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={80}
          height={20}
          className="mx-auto cursor-pointer object-contain"
          onClick={() => router.replace("/")}
          unoptimized
        />
      </div>

      {/* MAIN LAYOUT: Two columns (SidePanel + ChatPanel) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        {showLeftPanel && (
          <div className="w-[350px] flex-shrink-0 border-r border-[#222d34] bg-[#111b21] flex flex-col">
            <SidePanel
              showLeftPanel={showLeftPanel}
              handleOpenStoreLink={handleOpenStoreLink}
              isLoading={isLoading}
              uniqueUserPhones={uniqueUserPhones}
              filteredChats={filteredChats}
              userPhoneParam={userPhoneParam}
              handleChatSelect={handleChatSelect}
              getLastMessageInfo={getLastMessageInfo}
              formatTimestamp={formatTimestamp}
            />
          </div>
        )}

        {/* RIGHT PANEL */}
        {showRightPanel && (
          <div className="flex-1 flex flex-col">
            {activeChat ? (
              <ChatPanel
                activeChat={activeChat}
                isLoading={isLoading}
                isMobile={isMobile}
                phoneParam={phoneParam}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                chatEndRef={chatEndRef}
                handleBack={handleBack}
                handleToggleIntervention={handleToggleIntervention}
                handleRefresh={handleRefresh}
                handleTextAreaKeyDown={handleTextAreaKeyDown}
                handleSendMessage={handleSendMessage}
                parseEntryIntoSegments={parseEntryIntoSegments}
                formatTimestamp={formatTimestamp}
                choiceMapping={choiceMapping}
                getLastMessageInfo={getLastMessageInfo}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#8696a0]">
                No chat selected
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
