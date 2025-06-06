"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUp,
  Sparkles,
  // Mic,
  RefreshCw,
  Paperclip,
  Smile,
  // Image as ImageIcon,
} from "lucide-react";
import type { ConversationEntry, ChatRecord } from "@/app/page";

// Extend props to include isLightTheme
interface ChatPanelProps {
  activeChat: ChatRecord | undefined;
  isLoading: boolean;
  isMobile: boolean;
  phoneParam: string;
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  chatEndRef: React.RefObject<HTMLDivElement>;
  handleBack: () => void;
  handleToggleIntervention: () => void;
  handleRefresh: () => void;
  handleTextAreaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void;
  parseEntryIntoSegments: (
    entry: ConversationEntry
  ) => {
    isUser: boolean;
    type: "text" | "image" | "audio";
    text?: string;
    imageUrl?: string;
    caption?: string;
    choice?: string;
  }[];
  formatTimestamp: (ts: number) => string;
  choiceMapping: { [key: string]: string };
  getLastMessageInfo: (conversation: ConversationEntry[]) => { lastMsg: string; lastTs: number };
  handleOpenImageModal: () => void;
  isLightTheme: boolean; // New prop for theme
}

export default function ChatPanel({
  activeChat,
  isLoading,
  isMobile,
  // phoneParam,
  newMessage,
  setNewMessage,
  chatEndRef,
  handleBack,
  handleToggleIntervention,
  handleRefresh,
  handleTextAreaKeyDown,
  handleSendMessage,
  parseEntryIntoSegments,
  formatTimestamp,
  choiceMapping,
  getLastMessageInfo,
  handleOpenImageModal,
  isLightTheme,
}: ChatPanelProps) {
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat, isLoading]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  if (!activeChat) return null;

  const activeLastTs = getLastMessageInfo(activeChat.conversation).lastTs;
  const displayName = activeChat.phone || "Unknown";

  const handleOpenEmojiPicker = () => {
    textAreaRef.current?.focus();
    if (navigator.userAgent.includes("Macintosh")) {
      alert(`Aperte "Control" + "Command" + "Space" para abrir o seletor de emoji.`);
    } else {
      alert(`Aperte "Windows + ." para abrir o soletor de emoji`);
    }
  };

  return (
    <div className={`${isLightTheme ? "bg-gray-50" : "bg-[#0a1014]"} flex flex-col h-full ${isLightTheme ? "text-black" : "text-[#e9edef]"}`}>
      {/* HEADER */}
      <div className={`${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} flex items-center justify-between px-4 py-3`}>
        <div className="flex items-center gap-3">
          {isMobile && (
            <button className="mr-1" onClick={handleBack}>
              <ArrowLeft className={`${isLightTheme ? "text-black" : "text-white"} w-5 h-5`} />
            </button>
          )}
          <Image
            src="/images/default.png"
            alt="default avatar"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
            unoptimized
          />
          <div>
            <h2 className="font-medium">{displayName}</h2>
            <p className="text-xs">{activeLastTs ? formatTimestamp(activeLastTs) : ""}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Intervention toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm" title="Ao intervir você desligará as respostas automáticas">
              Intervir:
            </span>
            <button
              onClick={handleToggleIntervention}
              className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 ${activeChat.intervention ? (isLightTheme ? "bg-red-400" : "bg-[#f6213f]") : (isLightTheme ? "bg-gray-400" : "bg-[#374248]")}`}
            >
              <span
                className={`inline-block w-5 h-5 rounded-full shadow transform transition-transform duration-200 ${
                  activeChat.intervention ? "translate-x-6" : "translate-x-0.5"
                } bg-white`}
              />
            </button>
          </div>
          {/* Refresh */}
          <div className="flex items-center space-x-2">
            <span className="text-sm" title="Atualiza para ver novas mensagens e conversas">Atualizar:</span>
            <button
              onClick={handleRefresh}
              className={`${isLightTheme ? "bg-gray-300" : "bg-[#374248]"} p-2 rounded-full hover:${isLightTheme ? "bg-gray-400" : "bg-[#4a5961]"} transition-colors duration-200`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div
        className={`${isLightTheme ? "bg-white" : "bg-[#0b141a]"} flex-1 overflow-y-auto p-4`}
        style={{
          backgroundImage: isLightTheme ? "none" : `linear-gradient(rgba(11,20,26,0.95), rgba(11,20,26,0.95)), url("data:image/png;base64,...")`,
        }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Sparkles className={`${isLightTheme ? "text-gray-500" : "text-[#00a884]"} h-8 w-8 animate-spin`} />
          </div>
        ) : activeChat.conversation.length > 0 ? (
          <div>
            {activeChat.conversation.map((entry, i) => {
              // Changed section: combine segments into one bubble
              const segs = parseEntryIntoSegments(entry);
              const isUser = segs.length > 0 ? segs[0].isUser : false;
              const choice = segs.find(seg => seg.choice)?.choice;
              const combinedText = segs
                .filter(seg => seg.type === "text" && seg.text)
                .map(seg => seg.text)
                .join("\n");
              const images = segs.filter(seg => seg.type === "image" && seg.imageUrl);
              return (
                <React.Fragment key={i}>
                  <div className={isUser ? "flex justify-start mb-1" : "flex justify-end mb-1"}>
                    <div className={
                      isUser
                        ? `${isLightTheme ? "bg-gray-200 text-black" : "bg-[#202c33] text-white"} max-w-[70%] px-3 py-2 rounded-lg shadow-sm`
                        : `${isLightTheme ? "bg-green-200 text-black" : "bg-[#005c4b] text-white"} max-w-[70%] px-3 py-2 rounded-lg shadow-sm`
                    }>
                      {!isUser && choice && (
                        <div className="mb-1 text-right">
                          <span className="text-xs font-semibold bg-green-300 text-black rounded px-2 py-0.5">
                            {choiceMapping[choice] || choice}
                          </span>
                        </div>
                      )}
                      {combinedText && (
                        <p className="whitespace-pre-wrap break-words mb-2">{combinedText}</p>
                      )}
                      {images.length > 0 &&
                        images.map((img, idx) => (
                          <div className="mb-2" key={idx}>
                            <img src={img.imageUrl} alt={img.caption || "bot"} className="max-w-sm rounded-md" />
                            {img.caption && (
                              <p className="mt-1 text-sm">{img.caption}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                  {entry?.timestamp && (
                    <div className={`flex ${entry?.user ? "justify-start" : "justify-end"} mb-3`}>
                      <span className="text-xs text-[#8696a0]">{formatTimestamp(entry?.timestamp)}</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p>No messages yet</p>
              <p className="mt-2 text-sm">Start a conversation with {displayName}</p>
            </div>
          </div>
        )}
      </div>

      {/* MESSAGE INPUT */}
      <div className={`${isLightTheme ? "bg-gray-200" : "bg-[#202c33]"} p-3 flex-shrink-0`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleOpenEmojiPicker}
            className="rounded-full p-2 hover:bg-gray-300 text-[#8696a0]"
          >
            <Smile className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleOpenImageModal}
            className={`rounded-full p-2 ${
              isLightTheme
                ? "hover:bg-gray-300 text-[#8696a0]"
                : "hover:bg-[#374248] text-[#8696a0]"
            }`}
            title="Enviar imagem"
          >
            <Paperclip className="h-6 w-6" />
          </button>
          <textarea
            ref={textAreaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleTextAreaKeyDown}
            placeholder="Type a message"
            rows={1}
            className="flex-1 rounded-lg py-2 px-3 focus:outline-none resize-none overflow-y-auto border-none"
            style={{ backgroundColor: isLightTheme ? "#e5e7eb" : "#2a3942", color: isLightTheme ? "black" : undefined }}
          />
          <button type="submit" className="rounded-full p-2 bg-[#00a884] text-white hover:bg-[#06cf9c]">
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
