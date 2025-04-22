"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import React from "react";
import { LogOut } from "lucide-react";

// Components
import SidePanel from "@/components/conversation/SidePanel";
import ChatPanel from "@/components/conversation/ChatPanel";
import NavigationSideBar from "@/components/settings/NavigationSideBar";

// API functions
import { getChats, sendDirectMessage, toggleIntervention, logout } from "@/lib/api";

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
  attachment?: string;
  // New attachments field for image attachments from the backend
  attachments?: { type: string; url: string; caption?: string }[];
}

export interface ConversationEntry {
  user?: string;
  type?: string;
  timestamp?: number;
  externalId?: string;
  bot?: BotMessage;
  // Added optional image field to also support image messages from backend
  image?: string;
}

export interface ChatRecord {
  id: string;
  user_id: string;
  phone: string;
  email?: string;
  recipient: string;
  conversation: ConversationEntry[];
  intervention?: boolean;
  is_gift_mom?: boolean;
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
  PRODUCT_DISCUSSION: "DISCUSSAO_DO_PRODUTO",
  UNKNOWN: "DESCONHECIDO",
  UNKNOWN_OR_UNSATISFACTORY_OR_INNAPROPRIATE: "DESCONHECIDO_OU_INSUFICIENTE_OU_INADEQUADO",
  UNKNOWN_OR_INNAPROPRIATE_OR_BROAD: "DESCONHECIDO_OU_INADEQUADO_OU_AMPLO",
  UNKNOWN_OR_INNAPROPRIATE_OR_BROAD_OR_UNSATISFACTORY: "DESCONHECIDO_OU_INADEQUADO_OU_AMPLO_OU_INSUFICIENTE",
};

// --- Utility Functions ---
function parseEntryIntoSegments(entry: ConversationEntry) {
  const segments: {
    isUser: boolean;
    type: "text" | "image" | "audio";
    text?: string;
    imageUrl?: string;
    caption?: string;
    choice?: string;
  }[] = [];

  if (entry?.user) {
    // user entry
    if (entry?.type === "audio") {
      segments.push({ isUser: true, type: "audio", text: entry?.user });
    } else {
      segments.push({ isUser: true, type: "text", text: entry?.user });
    }
  } else if (entry?.bot?.message !== undefined) {
    // bot entry
    const botMsg = entry?.bot?.message;
    const choice = entry?.bot?.choice;
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

  // Process image attachments if they exist
  if (entry?.bot?.attachments && Array.isArray(entry?.bot.attachments)) {
    entry?.bot.attachments.forEach((att) => {
      if (att.type === "image" && att.url) {
        segments.push({
          isUser: false,
          type: "image",
          imageUrl: att.url,
          text: att.caption || "",
          choice: entry?.bot?.choice || "UNKNOWN",
        });
      }
    });
  }

  // Also check if the entry has a top-level "image" field
  if (entry?.image) {
    segments.push({
      isUser: false,
      type: "image",
      imageUrl: entry?.image,
      text: "", // Or you could add caption text if available
      choice: entry?.bot?.choice,
    });
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

  // Find the last entry with a valid timestamp by iterating backwards
  let lastEntry = null;
  for (let i = convo.length - 1; i >= 0; i--) {
    if ((convo[i]?.user || convo[i]?.bot) && convo[i].timestamp) {
      lastEntry = convo[i];
      break;
    }
  }
  if (!lastEntry) {
    lastEntry = convo.filter((entry) => entry?.user || entry?.bot).pop();
  }

  let raw = "";
  const ts = lastEntry?.timestamp || 0;
  if (lastEntry?.user) {
    raw = lastEntry.user;
  } else if (lastEntry?.bot?.message) {
    const b = lastEntry.bot.message;
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

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

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
      const data = await getChats(); // internally uses your updated request()
      setChats(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error fetching chats:", err);

      if (err.status === 401 || err.status === 500) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter + sort chats
  const filteredChats = [...chats]; // no filtering needed anymore
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOpenStoreLink = () => {
    const link = `https://api.whatsapp.com/send?phone=${phoneParam}`;
    window.open(link, "_blank");
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

  // Theme state and toggle
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'light' : true;
    }
    return true;
  });
  const toggleTheme = () => {
    setIsLightTheme((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'light' : 'dark');
      return newTheme;
    });
  };

  // State to control which panel is shown - always chat on this page
  const [activePanel, setActivePanel] = useState<"chat" | "funil" | "hots" | "last24">("chat");

  // Create a wrapper function to match the expected prop type
  const handleSetActivePanel = (panel: "carts" | "chat" | "funil" | "hots" | "last24") => {
    if (panel !== "carts") {
      setActivePanel(panel);
    }
  };

  const showLeftPanel = !isMobile || (!activeChat && activePanel === "chat");
  const showRightPanel = !isMobile || !!activeChat;

  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageCaption, setImageCaption] = useState("");

  const handleOpenImageModal = () => {
    setImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setImageFile(null);
    setImageCaption("");
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSendImageMessage = async () => {
    if (!activeChat || !imageFile) return;
    // Convert file to base64 (for example purposes)
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;
      try {
        await sendDirectMessage(phoneParam, userPhoneParam, imageCaption, base64Image as string);
        // Append the image message locally
        const appended = {
            bot: {
              choice: "HUMAN_INTERVENTION",
              // here we reuse message field to hold caption if needed
              message: imageCaption,
              "in-progress": false,
            },
            timestamp: Date.now(),
            // optionally add a field to indicate imageUrl
            image: typeof base64Image === "string" ? base64Image : "",
        };
        const updatedChat = {
          ...activeChat,
          conversation: [...activeChat.conversation, appended],
        };
        setChats((prev) => prev.map((c) => (c.id === activeChat.id ? updatedChat : c)));
      } catch (err) {
        console.error("Failed to send image message:", err);
      }
      handleCloseImageModal();
    };
    reader.readAsDataURL(imageFile);
  };

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

      {/* MAIN LAYOUT: Navigation + Two columns (SidePanel + ChatPanel/FunilPanel) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation sidebar */}
        <NavigationSideBar
          activePanel={activePanel}
          setActivePanel={handleSetActivePanel}
          isMobile={isMobile}
          isLightTheme={isLightTheme}
          toggleTheme={toggleTheme}
          handleLogout={handleLogout}
        />

        {/* Content area with adjusted padding for mobile bottom bar */}
        <div className={`flex flex-1 ${isMobile ? "pb-16" : ""}`}>
          {/* LEFT PANEL */}
          {showLeftPanel && (
            <div className={`${isMobile && !activeChat ? "w-full" : "w-[350px]"} flex-shrink-0 border-r ${isLightTheme ? "border-gray-300 bg-gray-100" : "border-[#222d34] bg-[#111b21]"} flex flex-col`}>
              <SidePanel
                showLeftPanel={showLeftPanel}
                isLoading={isLoading}
                uniqueUserPhones={uniqueUserPhones}
                filteredChats={filteredChats}
                userPhoneParam={userPhoneParam}
                handleChatSelect={handleChatSelect}
                getLastMessageInfo={getLastMessageInfo}
                formatTimestamp={formatTimestamp}
                isLightTheme={isLightTheme}
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
                  handleOpenImageModal={handleOpenImageModal}
                  isLightTheme={isLightTheme}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#8696a0]">
                  No chat selected
                </div>
              )}
            </div>
          )}
        </div>

        {/* IMAGE MODAL */}
        {imageModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className={`${isLightTheme ? "bg-white" : "bg-[#1f2c33]"} p-6 rounded-lg w-96 shadow-xl`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg font-medium ${isLightTheme ? "text-gray-800" : "text-white"}`}>
                  Enviar Imagem
                </h2>
                <button
                  onClick={handleCloseImageModal}
                  className={`rounded-full p-1 ${isLightTheme ? "hover:bg-gray-200" : "hover:bg-[#374248]"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLightTheme ? "text-gray-500" : "text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Image Preview */}
              <div className={`mb-4 border-2 border-dashed rounded-lg p-4 text-center ${isLightTheme ? "border-gray-300 bg-gray-50" : "border-gray-600 bg-[#2a3942]"}`}>
                {imageFile ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-md object-contain"
                    />
                    <button
                      onClick={() => setImageFile(null)}
                      className={`absolute top-1 right-1 rounded-full p-1 ${isLightTheme ? "bg-gray-200 hover:bg-gray-300" : "bg-[#374248] hover:bg-[#4a5c66]"}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mx-auto mb-2 ${isLightTheme ? "text-gray-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className={`text-sm ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>Clique para selecionar ou arraste uma imagem</p>
                  </div>
                )}
              </div>

              {/* File Input (hidden but functional) */}
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className={`block mb-4 py-2 px-4 text-center rounded-md cursor-pointer ${
                  isLightTheme
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-[#2a3942] text-white hover:bg-[#374248]"
                }`}
              >
                {imageFile ? "Alterar imagem" : "Selecionar imagem"}
              </label>

              {/* Caption Input */}
              <div className="mb-4">
                <label
                  htmlFor="caption"
                  className={`block mb-2 text-sm font-medium ${isLightTheme ? "text-gray-700" : "text-gray-300"}`}
                >
                  Legenda (opcional)
                </label>
                <textarea
                  id="caption"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Digite uma legenda para sua imagem..."
                  rows={3}
                  className={`w-full p-3 rounded-md resize-none focus:outline-none focus:ring-2 ${
                    isLightTheme
                      ? "bg-white border border-gray-300 text-gray-800 focus:ring-blue-500"
                      : "bg-[#2a3942] border border-[#374248] text-white focus:ring-[#00a884]"
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseImageModal}
                  className={`px-4 py-2 rounded-md font-medium ${
                    isLightTheme
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-[#374248] text-white hover:bg-[#4a5c66]"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendImageMessage}
                  disabled={!imageFile}
                  className={`px-4 py-2 rounded-md font-medium ${
                    !imageFile
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : isLightTheme
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-[#00a884] text-white hover:bg-[#06cf9c]"
                  }`}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
