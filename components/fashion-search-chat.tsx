// frontend
"use client";

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  Bot,
  ChevronLeft,
  ExternalLink,
  Menu,
  MessageSquare,
  PlusCircle,
  Settings,
  Sparkles,
  User
} from "lucide-react";
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  createChat,
  getChats,
  removeUser
} from '../lib/api';
import { getLocalizedText, getUserLanguage } from '../lib/localization';

import logo from '/public/images/logo.png';

type PromptKeys = "examplePrompt1" | "examplePrompt2" | "examplePrompt3";

interface Product {
  title: string;
  link: string;
  snippet: string;
  image: string;
  imageUrlsWithoutScreenshot: string[];
}

interface BotMessage {
  product: Product;
  score: number;
  explanation: string;
}

type BotResponse = string | BotMessage[];

interface ConversationMessage {
  user?: string;
  bot?: BotResponse;
  "in-progress"?: boolean;
}

interface UserData {
  email: string;
  country: string;
}

const timeZoneCityToCountry: { [key: string]: string } = {
  "New York": "us",
  "Los Angeles": "us",
  "Sao Paulo": "br",
};

const examplePromptsKeys: PromptKeys[] = ["examplePrompt1", "examplePrompt2", "examplePrompt3"];

// Define the backend API base URL
// const API_BASE_URL = 'http://localhost:4000';
const API_BASE_URL = 'https://estoque-server-df0876ed2a97.herokuapp.com';

export function FashionSearchChat() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const city = timeZone.split('/').pop()?.replace('_', ' ');
  const detectedDefaultCountry = timeZoneCityToCountry[city || ''] || 'us';

  const [conversations, setConversations] = useState<{ id: string; conversation: ConversationMessage[] }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [userData, setUserData] = useState<UserData>({
    email: '',
    country: 'us', // default value
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedImages, setSelectedImages] = useState<{ [key: string]: string }>({});

  const botResponseCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const botResponseTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const userLanguage = getUserLanguage(userData.country);
  
  const loadConversationById = useCallback((chatId: string) => {
    const chat = conversations.find(c => c.id === chatId);
    if (chat) {
      setConversation(chat.conversation);
    }
  }, [conversations]);

  const fetchChats = useCallback(async () => {
    try {
      const chats = await getChats();
      setConversations(chats);
      const chatIdFromUrl = searchParams.get('chat');
      if (chatIdFromUrl) {
        const matchedChat = chats.find((chat: { id: string; }) => chat.id === chatIdFromUrl);
        if (matchedChat) {
          setConversation(matchedChat.conversation);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [searchParams]);

  useEffect(() => {
    const storedCountry = localStorage.getItem('country') || detectedDefaultCountry;
    const storedEmail = localStorage.getItem('email');
    setUserData({
      email: storedEmail || '',
      country: storedCountry,
    });
  }, []);

  useEffect(() => {
    fetchChats();
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      setUserData((prev) => ({ ...prev, email: storedEmail }));
    }
  }, [fetchChats]);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chat');
    if (chatIdFromUrl) {
      setCurrentChatId(chatIdFromUrl);
      loadConversationById(chatIdFromUrl);
    }
  }, [searchParams, conversations, loadConversationById]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    return () => {
      // Cleanup intervals and timeouts
      if (botResponseCheckInterval.current) {
        clearInterval(botResponseCheckInterval.current);
      }
      if (botResponseTimeout.current) {
        clearTimeout(botResponseTimeout.current);
      }
    };
  }, []);

  const handleNewChat = async () => {
    setCurrentChatId(null);
    setConversation([]);
    router.push('/'); // Navigate to the root without a chatId
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const ProductCard = ({ product, explanation }: BotMessage) => {
    const selectedImage = selectedImages[product.title] || product.image;

    const handleImageClick = (url: string) => {
      setSelectedImages((prev) => ({ ...prev, [product.title]: url }));
    };

    const ProductImage = ({ selectedImage, product }: { selectedImage: string, product: Product }) => {
      const [imageSrc, setImageSrc] = useState(selectedImage || product.image);
    
      const handleError = () => {
        setImageSrc('https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg');
      };
    
      return (
        <img
          src={imageSrc}
          alt={product?.title || "Product Image"}
          className="object-cover w-full h-full"
          onError={handleError}
          style={{ width: '100%', height: '100%' }}
        />
      );
    }

    return (
      <Card className="w-full max-w-sm md:max-w-md mx-auto border-[#f6213f]/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-raleway font-medium">
              {product.title}
            </CardTitle>
          </div>
          <CardDescription className="font-nunito font-medium">
            {explanation}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-lg">
            <ProductImage selectedImage={selectedImage} product={product} />
          </div>
          {product.imageUrlsWithoutScreenshot?.length > 0 && (
            <div className="overflow-x-auto w-full whitespace-nowrap rounded-lg h-24">
              <div className="flex gap-2 p-2">
                {Array.from(new Set(product.imageUrlsWithoutScreenshot)).map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 flex-shrink-0 cursor-pointer hover:opacity-75 hover:border-4 hover:border-transparent" onClick={() => handleImageClick(url)}>
                    <ProductImage selectedImage={url} product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex gap-2 w-full">
            <Button className="flex-1 bg-[#f6213f] hover:bg-[#f6213f]" asChild>
              <a href={product.link} target="_blank" rel="noopener noreferrer" className="font-nunito font-medium">
                {getLocalizedText(userLanguage,"viewProduct")}
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  /**
   * Sends a message either by creating a new chat or updating an existing one.
   * @param message The message string to send.
   */
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ConversationMessage = { user: message };
    setConversation((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (!currentChatId) {
      try {
        // Create a new chat with the initial user message
        const newChat = await createChat(userData.email, message, userLanguage);
        console.log("newChat", newChat);
        setCurrentChatId(newChat.id);
        // Update the URL with the new chatId
        router.replace(`/?chat=${newChat.id}`);

        // Call updateChat to save the conversation
        updateChatMessages(newChat.id, [...conversation, userMessage]);

      } catch (error) {
        console.error('Error starting new chat:', error);
        setIsLoading(false);
      }
    } else {
      // Update existing chat
      updateChatMessages(currentChatId, [...conversation, userMessage]);
    }
  };

  /**
   * Updates the chat messages on the server and starts checking for bot responses.
   * @param chatId The ID of the chat to update.
   * @param updatedConversation The updated conversation array.
   */
  const updateChatMessages = (chatId: string, updatedConversation: ConversationMessage[]) => {
    // Call updateChat API but don't wait for response
    fetch(`${API_BASE_URL}/updateChat/${chatId}`, { // Updated URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation: updatedConversation, language: userLanguage })
    })
    .catch(error => {
      console.error('Error updating chat:', error);
      setIsLoading(false);
    });

    // Start checking for bot responses
    startBotResponseChecking(chatId);
  };

  const startBotResponseChecking = (chatId: string) => {
    // Clear any existing intervals or timeouts
    if (botResponseCheckInterval.current) {
      clearInterval(botResponseCheckInterval.current);
    }
    if (botResponseTimeout.current) {
      clearTimeout(botResponseTimeout.current);
    }

    // Start the interval to check for bot responses every 10s
    botResponseCheckInterval.current = setInterval(async () => {
      try {
        const chats = await getChats();
        setConversations(chats);

        // Find the current chat
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
          // Update conversation
          setConversation(chat.conversation);
          // Find the last bot message
          const lastBotMessageIndex = chat.conversation.map(msg => !!msg.bot).lastIndexOf(true);
          if (lastBotMessageIndex !== -1) {
            const lastBotMessage = chat.conversation[lastBotMessageIndex];
            // Check "in-progress" field
            if (lastBotMessage["in-progress"]) {
              // Bot is still processing, continue polling
            } else {
              // Bot has finished processing, stop polling
              setIsLoading(false);
              stopBotResponseChecking();
            }
          } else {
            // No bot message yet, continue polling
          }
        }
      } catch (error) {
        console.error('Error fetching chats during bot response check:', error);
        setIsLoading(false);
        stopBotResponseChecking();
      }
    }, 10000); // Every 10 seconds

    // Set a timeout to stop checking after 1m30s (90,000ms)
    botResponseTimeout.current = setTimeout(() => {
      setIsLoading(false);
      stopBotResponseChecking();
    }, 90000); // After 90 seconds
  };

  const stopBotResponseChecking = () => {
    if (botResponseCheckInterval.current) {
      clearInterval(botResponseCheckInterval.current);
      botResponseCheckInterval.current = null;
    }
    if (botResponseTimeout.current) {
      clearTimeout(botResponseTimeout.current);
      botResponseTimeout.current = null;
    }
  };

  /**
   * Handles the form submission event.
   * @param e The form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  /**
   * Handle country change
   */
  const handleCountryChange = (value: string) => {
    setUserData((prev) => ({ ...prev, country: value }));
    localStorage.setItem('country', value);
  };

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      await removeUser(userData.email);
      localStorage.removeItem('country');
      localStorage.removeItem('email');
      setUserData({ email: '', country: detectedDefaultCountry });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-white shadow-lg flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center justify-between w-full bg-white">
              <div className="flex items-center">
                <Image
                  src={logo}
                  alt="Logo"
                  width={120}
                  height={30}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-4 h-4 bg-white" />
            </Button>
          )}
        </div>

        <div className="p-2">
          <Button
            variant="ghost"
            onClick={handleNewChat}
            className="text-gray-600 hover:text-gray-900 flex items-center font-nunito font-medium"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {sidebarOpen && getLocalizedText(userLanguage, "newChat")}
          </Button>
        </div>

        <ScrollArea className="flex-1 pb-20">
          <div className="p-2">
            {conversations.filter(conv => currentChatId === conv.id).map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/?chat=${conv.id}`)}
                className={cn(
                  "w-full text-left mb-1 rounded-lg transition-colors duration-200",
                  sidebarOpen ? "p-2 hover:bg-gray-100 flex items-center gap-2" : "p-2 hover:bg-gray-100 flex justify-center"
                )}
              >
                {sidebarOpen ? (
                  <>
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <span className="truncate font-nunito font-medium">{conv.conversation[0]?.user}</span>
                  </>
                ) : (
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-5 border-t border-gray-200">
          <div className={cn(
            "flex items-center",
            sidebarOpen ? "justify-between" : "justify-center"
          )}>
            {sidebarOpen && (
              <div className="flex items-center">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarFallback>
                    <User className="w-6 h-6 -mt-2" />
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="text-sm truncate font-nunito font-medium">
                    {userData.email || getLocalizedText(userLanguage, "guest")}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate font-nunito font-medium">
                    {getLocalizedText(userLanguage, "tier")}
                  </p>
                </div>
              </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end" alignOffset={-40}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="font-nunito font-medium">{getLocalizedText(userLanguage, "country")}</Label>
                    <Select
                      value={userData.country}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={getLocalizedText(userLanguage, "selectCountry")} className="font-nunito" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us" className="font-nunito">
                          {getLocalizedText(userLanguage, "unitedstates")}
                        </SelectItem>
                        <SelectItem value="br" className="font-nunito">
                          {getLocalizedText(userLanguage, "brazil")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {userData.email && (
                    <Button className="bg-[#f6213f] hover:bg-[#f6213f] w-full font-nunito font-medium" onClick={handleLogout}>
                      {getLocalizedText(userLanguage, "logout")}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:ml-64 ml-16" : "ml-16"
      )}>
        {/* Chat Area */}
        <ScrollArea className="flex-1 pb-20">
          <div className="flex-1 p-4">
            {conversation.length === 0 ? (
              <div className="w-full max-w-2xl mx-auto px-4 text-center flex flex-col justify-center items-center min-h-screen">
                <Image
                  src={logo}
                  alt="Fashion Search Chat Logo"
                  width={256}
                  unoptimized
                  className="mb-6"
                />
                <h1 className="text-4xl font-nunito font-medium mb-2 text-gray-800 font-raleway">{getLocalizedText(userLanguage, "callPrompt")}</h1>
                <p className="text-xl text-gray-600 mb-8 font-nunito font-medium">{getLocalizedText(userLanguage, "introMessage")}</p>
                <div className="space-y-4">
                  <form onSubmit={handleSubmit} className="flex flex-row gap-2 max-w-3xl mx-auto">
                    <textarea
                      onKeyDown={handleKeyDown}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={getLocalizedText(userLanguage, "describeItem")}
                      className="flex-1 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md resize-none overflow-y-auto font-nunito font-medium"
                      rows={3}
                      style={{ width: "75%" }} // Adjust textarea width to fit properly
                      disabled={isLoading}
                    />
                    <button disabled={isLoading} type="submit" className="w-12 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#f6213f] hover:bg-[#d2102c] flex items-center justify-center mx-auto">
                        <ArrowUp className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  </form>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {examplePromptsKeys.map((promptKey) => (
                      <Button
                        key={promptKey}
                        variant="outline"
                        onClick={() => sendMessage(getLocalizedText(userLanguage, promptKey))}
                        className="bg-white hover:bg-gray-100 text-gray-800 transition-colors duration-200 font-nunito font-medium"
                      >
                        {getLocalizedText(userLanguage, promptKey)}
                      </Button>
                    ))}
                  </div>
                  {/* Coming soon */}
                  <div className="flex justify-center">
                    <div className="relative group w-40 h-10 mb-4 mt-24">
                      <button className="bg-[#f6213f] text-white hover:bg-[#d2102c] font-medium rounded-full text-sm px-6 py-2">
                        <div className="flex items-center">
                          <Sparkles width={12} height={12} className="mr-2"/>
                          <span>Coming Soon</span>
                        </div>
                      </button>
                      {/* Hover Overlay */}
                      <div className="absolute hidden group-hover:flex bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-4 bg-white border border-gray-300 shadow-lg rounded-lg z-50">
                        <ul className="list-disc pl-5 text-sm text-gray-600 font-nunito space-y-2 text-left">
                          <li>
                            <strong>{getLocalizedText(userLanguage, "virtualFitPreviewTitle")}</strong><br />
                            {getLocalizedText(userLanguage, "virtualFitPreviewSubtitle")}
                          </li>
                          <li>
                            <strong>{getLocalizedText(userLanguage, "personalizedStyleFeedTitle")}</strong><br />
                            {getLocalizedText(userLanguage, "personalizedStyleFeedSubtitle")}
                          </li>
                          <li>
                            <strong>{getLocalizedText(userLanguage, "smartFashionAssistantTitle")}</strong><br />
                            {getLocalizedText(userLanguage, "smartFashionAssistantSubtitle")}
                          </li>
                          <li>
                            <strong>{getLocalizedText(userLanguage, "seamlessCheckoutTrackingTitle")}</strong><br />
                            {getLocalizedText(userLanguage, "seamlessCheckoutTrackingSubtitle")}
                          </li>
                          <li>
                            <strong>{getLocalizedText(userLanguage, "exclusiveDealsStockAlertsTitle")}</strong><br />
                            {getLocalizedText(userLanguage, "exclusiveDealsStockAlertsSubtitle")}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {conversation.map((message, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-4",
                      message.user ? "justify-end" : "justify-start"
                    )}
                  >
                    {!message.user && (
                      <Avatar className="mt-2 w-8 h-8">
                        <AvatarFallback>
                          <Sparkles className="w-6 h-6 text-[#f6213f]" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "rounded-lg p-4 bg-white shadow-sm overflow-wrap break-word",
                      message.user ? "bg-[#f6213f]/30 text-gray-800 max-w-[70%] font-nunito font-medium" : "max-w-[80%] font-nunito font-medium"
                    )}>
                      {message.user ? message.user : (
                        Array.isArray(message.bot) ? (
                          message.bot.length > 0 ? (
                            <div className="space-y-4">
                              {message.bot.map((item, idx) => (
                                <ProductCard key={idx} {...item} />
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg font-nunito font-medium">
                              {getLocalizedText(userLanguage, "noResults")}
                            </div>
                          )
                        ) : (
                          <div className="bg-white rounded-lg font-nunito font-medium">
                            {message.bot}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-4 justify-center p-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-ping" />
                      <div className="absolute inset-2 border-4 border-[#f6213f] rounded-full animate-spin" />
                      <Sparkles className="absolute inset-3 w-6 h-6 text-[#f6213f]" />
                    </div>
                    <span className="text-gray-500 text-lg font-medium font-nunito">{getLocalizedText(userLanguage, "thinking")}</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {conversation.length > 0 && (
          <div className="fixed bottom-0 left-16 right-0 p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex flex-row gap-2 max-w-3xl mx-auto">
              <textarea
                onKeyDown={handleKeyDown}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getLocalizedText(userLanguage, "describeItem")}
                className="flex-1 bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md resize-none overflow-y-auto font-nunito font-medium"
                rows={1}
                disabled={isLoading}
              />
              <button disabled={isLoading} type="submit" className="w-12 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#f6213f] hover:bg-[#d2102c] flex items-center justify-center mx-auto">
                  <ArrowUp className="w-6 h-6 text-white" />
                </div>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export function FashionSearchChatWrapper() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <FashionSearchChat />
    </Suspense>
  );
}
