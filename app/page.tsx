"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowUp, Sparkles, Mic, RefreshCw } from "lucide-react";

// Example UI components / API
import { getChats, sendDirectMessage, toggleIntervention } from "@/lib/api";
import React from "react";

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
}

const choiceMapping: { [key: string]: string } = {
  "GREETING": "SAUDAÇÃO",
  "INVENTORY_LOOKUP": "CONSULTA_DE_ESTOQUE",
  "INTENT_SUMMARY_VARIANTS": "RESUMO_DE_INTENÇÃO_VARIANTES",
  "PRODUCT_MORE_IMAGES": "MAIS_IMAGENS_DO_PRODUTO",
  "DELIVERY_PICKUP_OPTIONS": "OPÇÕES_DE_ENTREGA_OU_RETIRADA",
  "PAYMENT_OPTIONS": "OPÇÕES_DE_PAGAMENTO",
  "CONCLUSION": "CONCLUSÃO",
  "HUMAN_INTERVENTION": "INTERVENÇÃO_HUMANA",
  "ORDER_STATUS": "STATUS_DO_PEDIDO",
  "UNKNOWN_OR_INNAPROPRIATE_OR_BROAD":"DESCONHECIDO_OU_INADEQUADO_OU_AMPLO"
};


/** Convert a conversation entry into simpler segments (text, image, or audio). */
function parseEntryIntoSegments(entry: ConversationEntry) {
  const segments: {
    isUser: boolean;
    type: "text" | "image" | "audio";
    text?: string;
    imageUrl?: string;
    choice?: string;
  }[] = [];

  if (entry.user) {
    if (entry.type === "audio") {
      segments.push({ isUser: true, type: "audio", text: entry.user });
    } else {
      segments.push({ isUser: true, type: "text", text: entry.user });
    }
  } else if (entry.bot?.message !== undefined) {
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

/** Format a timestamp as "4:44 PM", "Yesterday", weekday, or dd/mm/yyyy. */
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

/** Get last message info (truncated message and timestamp) from a conversation. */
function getLastMessageInfo(convo: ConversationEntry[]) {
  if (!convo || convo.length === 0) return { lastMsg: "", lastTs: 0 };

  const last = convo.filter(entry => entry.user).pop();
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

export default function AdminPage() {
  const router = useRouter();

  // Read initial URL params on mount.
  const [phoneParam, setPhoneParam] = useState("");
  const [userPhoneParam, setUserPhoneParam] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPhoneParam(params.get("phone") || "");
    setUserPhoneParam(params.get("user") || "");
  }, []);

  // Handler to update state and URL when selecting a chat.
  const handleChatSelect = (uPhone: string) => {
    setUserPhoneParam(uPhone);
    router.replace(`/?phone=${phoneParam}&user=${uPhone}`);
  };

  // Handler for mobile back arrow to clear the active chat.
  const handleBack = () => {
    setUserPhoneParam("");
    router.replace(`/?phone=${phoneParam}`);
  };

  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function fetchData() {
    try {
      setIsLoading(true);
      const data = await getChats();
      setChats(data);
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Filter chats for the provided store phone.
  const filteredChats = chats.filter((c) => c.recipient === phoneParam);

  // Sort chats so that those with intervention appear first.
  filteredChats.sort((a, b) => {
    const aInt = a.intervention ? 1 : 0;
    const bInt = b.intervention ? 1 : 0;
    return bInt - aInt;
  });

  // Get distinct user phones.
  const uniqueUserPhones = Array.from(
    new Set(filteredChats.map((c) => c.phone).filter(Boolean))
  );

  // Determine active chat based on the selected userPhoneParam.
  const activeChat = filteredChats.find((c) => c.phone === userPhoneParam);

  // For showing the active chat's last message time in the header:
  const activeLastTs = activeChat
    ? getLastMessageInfo(activeChat.conversation).lastTs
    : 0;

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat, isLoading]);

  const handleSendMessage = async () => {
    if (!activeChat || !newMessage.trim()) return;

    const trimmedMessage = newMessage.trim();
    const appended = {
      bot: {
        choice: "HUMAN_INTERVENTION",
        message: trimmedMessage,
        "in-progress": false,
        "progress-message": "",
      },
      timestamp: Date.now(),
    };
    const updatedChat = {
      ...activeChat,
      conversation: [...activeChat.conversation, appended],
    };

    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? updatedChat : c))
    );
    setNewMessage("");

    try {
      await sendDirectMessage(phoneParam, userPhoneParam, trimmedMessage);
      console.log("Message sent!");
    } catch (err) {
      console.error("Failed to send direct message:", err);
    }
  };

  const handleToggleIntervention = async () => {
    if (!activeChat) return;
    const newValue = !activeChat.intervention;
    const updatedChat = { ...activeChat, intervention: newValue };
    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? updatedChat : c))
    );

    try {
      await toggleIntervention(phoneParam, userPhoneParam);
      console.log("Intervention toggled!");
    } catch (err) {
      console.error("Failed to toggle intervention:", err);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  // Detect mobile view.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
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

  // Open new window with store link
  const handleOpenStoreLink = () => {
    const link = `https://api.whatsapp.com/send?phone=${phoneParam}`;
    window.open(link, '_blank');
    console.log("Store link opened:", link);
  };

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-50 text-gray-900">
      {/* TOP NAV BAR */}
      <div className="relative text-center p-4 border-b border-gray-200">
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

      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* LEFT PANEL: Chat list */}
        {showLeftPanel && (
          <div className="md:w-80 w-full md:flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-lg">Chats</span>
              <button
                title="Abra o link de chat da sua loja"
                onClick={handleOpenStoreLink}
                className="px-3 py-1 text-sm border rounded-md text-gray-700 hover:bg-[#d2102c3f] active:bg-[#d2102c]"
              >
                Abrir link
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-4 p-4 justify-center">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-ping" />
                  <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 w-6 h-6 text-[#f6213f] m-auto" />
                </div>
                <span className="text-gray-500 text-base font-medium">Carregando...</span>
              </div>
            ) : (
              <ul>
                {uniqueUserPhones.map((uPhone) => {
                  const chat = filteredChats.find((c) => c.phone === uPhone);
                  if (!chat) return null;
                  const { lastMsg, lastTs } = getLastMessageInfo(chat.conversation);
                  const timeLabel = lastTs ? formatTimestamp(lastTs) : "";
                  const displayName = chat.phone || uPhone;

                  return (
                    <li
                      key={uPhone}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 ${
                        userPhoneParam === uPhone ? "bg-gray-200" : ""
                      }`}
                      onClick={() => handleChatSelect(uPhone)}
                    >
                      <Image
                        src="/images/default.png"
                        alt="avatar"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        unoptimized
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">
                            {displayName.length > 15 ? displayName.slice(0, 15) + "…" : displayName}
                          </div>
                          {timeLabel && (
                            <div className="text-xs text-gray-500 ml-2">{timeLabel}</div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">{lastMsg}</div>
                      </div>
                      {chat.intervention && (
                        <span className="ml-2 text-xs bg-[#f6213f] text-white px-2 py-1 rounded">
                          intervido
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* RIGHT PANEL: Conversation */}
        {showRightPanel && (
          <div className="relative flex-1 flex flex-col">
            <div className="fixed top-0 left-0 md:left-80 right-0 border-b border-gray-200 p-4 bg-white z-50 flex items-center justify-between">
              <div className="flex items-center">
                {isMobile && activeChat && (
                  <button className="mr-3" onClick={handleBack}>
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                  </button>
                )}
                {activeChat ? (
                  <div className="flex items-center">
                    <Image
                      src="/images/default.png"
                      alt="default avatar"
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover mr-4"
                      unoptimized
                    />
                    <div className="flex flex-col">
                      <div className="font-semibold">{activeChat.phone}</div>
                      <div className="text-sm text-gray-500">
                        Última mensagem:{" "}
                        {activeLastTs ? formatTimestamp(activeLastTs) : ""}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">No chat selected</div>
                )}
              </div>

              {activeChat && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700" title="Ao intervir você desligará as respostas automáticas">Intervir:</span>
                    <button
                      title="Ao intervir você desligará as respostas automáticas"
                      onClick={handleToggleIntervention}
                      className={`relative inline-flex w-12 h-6 hover:bg-[#d2102c3f] rounded-full transition-colors ease-in-out duration-200 ${
                        activeChat.intervention ? "bg-[#f6213f]" : "bg-gray-300"
                      }`}
                      aria-label="Toggle Intervention"
                    >
                      <span
                        className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition ease-in-out duration-200 translate-x-0.5 ${
                          activeChat.intervention ? "translate-x-6" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700" title="Atualiza para ver novas mensages e conversas">Atualizar:</span>
                    <button
                      title="Atualiza para ver novas mensages e conversas"
                      onClick={handleRefresh}
                      className="p-2 text-white bg-gray-300 rounded-full hover:bg-[#d2102c3f] active:bg-[#d2102c] transition-colors duration-200 focus:outline-none"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 pt-10 space-y-2 pb-[100px]">
              {isLoading && (
                <div className="flex items-center gap-4 p-4 justify-center">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-ping" />
                    <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 w-6 h-6 text-[#f6213f] m-auto" />
                  </div>
                  <span className="text-gray-500 text-base font-medium">Carregando...</span>
                </div>
              )}

                {!isLoading && activeChat ? (
                  activeChat.conversation.map((entry, i) => {
                  const segs = parseEntryIntoSegments(entry);
                  // Assume all segments in an entry belong to the same sender
                  const isUser = segs[0]?.isUser;
                  return (
                    <React.Fragment key={i}>
                    {segs.map((seg, sIdx) => {
                      const wrapperClass = seg.isUser ? "flex justify-start" : "flex justify-end";
                      const bubbleClass = seg.isUser
                      ? "p-3 bg-white shadow-sm text-gray-800 max-w-[80%] rounded-lg"
                      : "p-3 bg-[#f6213f]/30 text-gray-800 max-w-[80%] rounded-lg";

                      if (seg.type === "text") {
                      return (
                        <div key={`${i}-${sIdx}`} className={wrapperClass}>
                        <div className={bubbleClass}>
                          {!seg.isUser && seg.choice && (
                          <div className="mb-1 text-right">
                            <span className="text-xs font-semibold bg-red-300 text-red-900 rounded px-2 py-0.5">
                            {choiceMapping[seg.choice] || seg.choice}
                            </span>
                          </div>
                          )}
                          {seg.text}
                        </div>
                        </div>
                      );
                      } else if (seg.type === "image") {
                      return (
                        <div key={`${i}-${sIdx}`} className={wrapperClass}>
                        <div className={bubbleClass}>
                          {!seg.isUser && seg.choice && (
                          <div className="mb-1 text-right">
                            <span className="text-xs font-semibold bg-red-300 text-red-900 rounded px-2 py-0.5">
                            {choiceMapping[seg.choice] || seg.choice}
                            </span>
                          </div>
                          )}
                          {seg.imageUrl && (
                          <div className="mb-2">
                            <img
                            src={seg.imageUrl}
                            alt="bot"
                            className="max-w-sm rounded-md"
                            />
                          </div>
                          )}
                          {seg.text}
                        </div>
                        </div>
                      );
                      } else if (seg.type === "audio") {
                      return (
                        <div key={`${i}-${sIdx}`} className={wrapperClass}>
                        <div className={`${bubbleClass} italic`}>
                          {!seg.isUser && seg.choice && (
                          <div className="mb-1 text-right">
                            <span className="text-xs font-semibold bg-red-300 text-red-900 rounded px-2 py-0.5">
                            {choiceMapping[seg.choice] || seg.choice}
                            </span>
                          </div>
                          )}
                          <span className="flex items-center gap-1">
                          <Mic className="w-4 h-4" />
                          <q>
                            {seg.text}
                          </q>
                          </span>
                        </div>
                        </div>
                      );
                      }
                      return null;
                    })}
                    {/* Render the timestamp if available */}
                    {entry.timestamp && (
                      <div className={`flex ${isUser ? "justify-start" : "justify-end"} mt-1`}>
                      <small className="text-xs text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </small>
                      </div>
                    )}
                    </React.Fragment>
                  );
                  })
                ) : (
                  !isLoading &&
                  phoneParam && (
                  <div className="text-gray-400 italic">Select a user phone on the left</div>
                )
              )}
              <div ref={chatEndRef} />
            </div>

            {activeChat && (
              <div className="fixed bottom-0 left-0 md:left-80 right-0 border-t border-gray-200 bg-white p-4 z-50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex flex-row gap-2"
                >
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleTextAreaKeyDown}
                    placeholder="Escreva algo..."
                    className="flex-1 bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md resize-none overflow-y-auto"
                    rows={1}
                  />
                  <button type="submit" className="w-12 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#f6213f] hover:bg-[#d2102c] flex items-center justify-center mx-auto">
                      <ArrowUp className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
