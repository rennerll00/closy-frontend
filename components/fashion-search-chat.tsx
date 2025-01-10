"use client";

// Import statements
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
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
import hardcodedResponses from '@/lib/hardcodedResponses';
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
  PlusCircle,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Undo,
  User
} from "lucide-react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  checkChat,
  createChat,
  getChats,
  removeUser,
  saveOpenFeedback,
  saveStarsFeedback,
  signupUser,
  undoLastChatMessages,
  updateChatMessages,
  updateChatMessagesFollowUp
} from '../lib/api';
import { getLocalizedText, getUserLanguage, LocalizationStrings } from '../lib/localization';

import React from 'react';
import logo from '/public/images/logo.png';

interface ConversationMessage {
  user?: string;
  bot?: BotResponse;
}

interface BotResponse {
  "in-progress": boolean;
  "progress-message"?: string;
  message: BotMessage[] | string;
}

interface BotMessage {
  lookNumber: number;
  searchType: string;
  preferences: string;
  message: string;
  explanation: string;
  items: Item[];
}

interface Item {
  itemName: string;
  itemResults: ItemResult[];
}

interface ItemResult {
  lookNumber: number;
  score: number;
  product: Product;
  explanation: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  ecommerce_title: string;
  ecommerce_logo: string;
  ecommerce_link: string;
  link: string;
  image: string;
  images_urls: string[];
  snippet: string;
  short_description: string;
  long_description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image_attributes: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image_classifications: Record<string, any>;
  variants: Variant[];
}

interface Variant {
  variantId: string;
  color: string;
  price: number;
}

interface UserData {
  id: string;
  email: string;
  country: string;
}

const timeZoneCityToCountry: { [key: string]: string } = {
  "New York": "us",
  "Los Angeles": "us",
  "Sao Paulo": "br",
};

const exampleMainPromptsKeys: (keyof LocalizationStrings)[] = [
  "exampleMainPrompt1",
  "exampleMainPrompt2",
  "exampleMainPrompt3"
];

function Carousel({ children }: { children: React.ReactNode }) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const total = React.Children.count(children)

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1))
  }

  const next = () => {
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {React.Children.map(children, (child) => (
            <div className="flex-shrink-0 w-full">{child}</div>
          ))}
        </div>
      </div>
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-primary" />
          </button>
          <button
            onClick={next}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-primary" />
          </button>
        </>
      )}
    </div>
  )
}

interface Props {
  items: Item[];
}

function ImprovedCarouselGrid({ items }: Props) {
  const allResults = items.flatMap(item =>
    item.itemResults.map(result => ({
      ...result,
      itemName: item.itemName.charAt(0).toUpperCase() + item.itemName.slice(1)
    }))
  );

  return (
    <div className="py-4 px-2">
      <Carousel>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {allResults.map((result, idx) => (
            <ProductCard
              key={idx}
              itemName={result.itemName}
              product={result.product}
              explanation={result.explanation}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}

function ProductCard({ itemName, product, explanation }: { itemName: string; product: Product, explanation: string }) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg';
  };

  return (
    <a 
      href={product.link} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="relative w-full h-full aspect-[9/16] rounded-lg overflow-hidden group cursor-pointer"
    >
      <div className="relative w-full h-full">
        <img
          src={product.image}
          alt={itemName || "Product"}
          className="object-cover w-full h-full transition-transform duration-300 scale-105"
          onError={handleError}
        />
        <div
          className="
            absolute inset-0 
            opacity-100 
            transition-all duration-100 
            bg-gradient-to-t from-black/40 via-transparent to-transparent 
            group-hover:from-black/70 
          "
        />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-2 group-hover:py-4 text-white flex flex-col items-start">
          {product.ecommerce_logo && product.ecommerce_logo.includes("https") ? (
            <div className="h-3 sm:h-5 overflow-hidden mb-1">
              <Image
                src={product.ecommerce_logo}
                alt="Logo"
                width={80}
                height={10}
                style={{
                  filter: "brightness(0) invert(1)",
                }}
                className="object-contain w-full h-full"
                unoptimized
              />
            </div>
          ) : (
            <h1 className="text-xl font-bold uppercase">
              {product.ecommerce_title}
            </h1>
          )}

          <h3 className="text-sm md:text-md font-semibold leading-tight">
            {itemName} | R${(product.price / 100).toFixed(2)}
          </h3>
          <p className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300 mt-2">
            {explanation}
          </p>
        </div>
      </div>
    </a>
  )
}

export function FashionSearchChat() {
  const router = useRouter();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const city = timeZone.split('/').pop()?.replace('_', ' ');
  const detectedDefaultCountry = timeZoneCityToCountry[city || ''] || 'us';

  const [conversations, setConversations] = useState<{ id: string; user_id: string; conversation: ConversationMessage[], rating?: number; feedback?: string; created_at: string; }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchType, setSearchType] = useState('');
  const [userData, setUserData] = useState<UserData>({
    id: '',
    email: '',
    country: 'br',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const botResponseCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const [isAwaitingEmail, setIsAwaitingEmail] = useState(false);
  const [pendingConversation, setPendingConversation] = useState<ConversationMessage[]>([]);
  const [chatIdFromUrl, setChatIdFromUrl] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [starRating, setStarRating] = useState<number | null>(null);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [hasClosedProfilePrompt, setHasClosedProfilePrompt] = useState(false);
  const userLanguage = getUserLanguage(userData.country);

  // **Added State Variables**
  const [isWaitingFeedback, setIsWaitingFeedback] = useState(false);

  // Define feedbackSuggestionsKeys based on the condition
  const feedbackSuggestionsKeys: string[] = searchType === "ABSTRACT"
    ? [
      getLocalizedText(userLanguage, "regenerateIt"),
      getLocalizedText(userLanguage, "modifyLookRemoveItem"),
      getLocalizedText(userLanguage, "modifyLookAddItem"),
      getLocalizedText(userLanguage, "modifyLookAlterItem"),
    ]
    : [
      getLocalizedText(userLanguage, "regenerateIt"),
      getLocalizedText(userLanguage, "modifyAlterItem"),
    ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const chatId = params.get('chat');
      setChatIdFromUrl(chatId);
    }
  }, []);

  const loadConversationById = useCallback((chatId: string) => {
    const chat = conversations.find(c => c.id === chatId);
    if (chat) {
      setConversation(chat.conversation);
      scrollToBottom();

      // 1. Find the last bot message that had a "message" array (the looks)
      let lastBotIndex = -1;
      for (let i = conversation.length - 1; i >= 0; i--) {
        const entry = conversation[i];
        if (entry.bot && Array.isArray(entry.bot.message) && entry.bot.message.length > 0) {
          lastBotIndex = i;
          break;
        }
      }

      // If no such bot message found, return a neutral response
      if (lastBotIndex !== -1) {
        const lastBotArrayMessage = conversation[lastBotIndex]?.bot?.message ?? [];
        const message = lastBotArrayMessage[0];

        if (typeof message !== 'string') {
          const searchType = message.searchType;
          setSearchType(searchType);
        }
      }
      
      if (chat.rating) {
        setStarRating(chat.rating);
        setShowFeedbackForm(false);
      }
      if (chat.feedback) {
        setWrittenFeedback(chat.feedback);
        setShowFeedbackForm(false);
      }
    }
  }, [conversations]);

  const fetchChats = useCallback(async () => {
    try {
      const chats = await getChats();
      setConversations(chats);
      if (chatIdFromUrl) {
        const matchedChat = chats.find((chat: { id: string; }) => chat.id === chatIdFromUrl);
        if (matchedChat) {
          setConversation(matchedChat.conversation);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [chatIdFromUrl]);

  useEffect(() => {
    const storedId = localStorage.getItem('id');
    const storedEmail = localStorage.getItem('email');
    const storedCountry = localStorage.getItem('country') || detectedDefaultCountry;
    setUserData({
      id: storedId || '',
      email: storedEmail || '',
      country: storedCountry,
    });
  }, [detectedDefaultCountry]);

  useEffect(() => {
    fetchChats();
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      setUserData((prev) => ({ ...prev, email: storedEmail }));
    }
  }, [fetchChats]);

  useEffect(() => {
    if (chatIdFromUrl) {
      setCurrentChatId(chatIdFromUrl);
      loadConversationById(chatIdFromUrl);
    }
  }, [chatIdFromUrl, conversations, loadConversationById]);

  useEffect(() => {
    return () => {
      if (botResponseCheckInterval.current) {
        clearInterval(botResponseCheckInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage.bot && lastMessage.bot["in-progress"] === false) {
        if (typeof lastMessage.bot.message === 'string' &&
          (lastMessage.bot.message === getLocalizedText(userLanguage, "askEmail") ||
            lastMessage.bot.message === getLocalizedText(userLanguage, "invalidEmail"))) {
          setShowFeedbackForm(false);
          setShowProfilePrompt(false);
          return;
        }

        if (Array.isArray(lastMessage.bot.message) && lastMessage.bot.message.length > 0) {
          const hasItems = lastMessage.bot.message.some((messageContent) => {
            return Array.isArray(messageContent.items) && messageContent.items.length > 0;
          });
          if (hasItems) {
            const profile = localStorage.getItem('profile');
            if (!profile || profile === "{}") {
              setShowFeedbackForm(false);
              setShowProfilePrompt(true);
            } else {
              const chat = conversations.find(c => c.id === currentChatId);
              if (chat) {
                if (chat.rating) {
                  setStarRating(chat.rating);
                } else {
                  setShowFeedbackForm(false);
                }
                if (chat.feedback) {
                  setWrittenFeedback(chat.feedback);
                }
              } else {
                setShowFeedbackForm(false);
              }
            }
          } else {
            setShowFeedbackForm(false);
            const profile = localStorage.getItem('profile');
            if (!profile || profile === "{}") {
              setShowProfilePrompt(true);
            }
          }
        } else {
          setShowFeedbackForm(false);
          const profile = localStorage.getItem('profile');
          if (!profile || profile === "{}") {
            setShowProfilePrompt(true);
          }
        }
      } else {
        setShowFeedbackForm(false);
      }
    } else {
      setShowFeedbackForm(false);
    }

    // **Handle isWaitingFeedback and isWaitingBuy**
    const lastBotMessage = conversation[conversation.length - 1]?.bot;
    if (lastBotMessage) {
      if (lastBotMessage.message === 'WAITING_FEEDBACK') {
        setIsWaitingFeedback(true);
      } else if (lastBotMessage.message === 'BUY') {
        setIsWaitingFeedback(false); // Ensure isWaitingFeedback is false
        setShowFeedbackForm(true);
      } else {
        setIsWaitingFeedback(false);
      }
    } else {
      setIsWaitingFeedback(false);
    }

  }, [conversation, conversations, currentChatId, userLanguage]);

  // Redefine isWaitingFeedback based on the entire conversation
  // **Removed this redundant variable as we handled it in useEffect above**
  // const isWaitingFeedback = (conversation.length > 0 && conversation[conversation.length - 1].bot && !isLoading && conversation[conversation.length - 1].bot?.message === 'WAITING_FEEDBACK');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setConversation([]);
    setInput('');
    setIsLoading(false);
    setShowFeedbackForm(false);
    setStarRating(null);
    setWrittenFeedback('');
    setShowFeedbackPopup(false);
    setShowProfilePrompt(false);
  
    const params = new URLSearchParams(window.location.search);
    params.delete('chat');
  
    window.location.href = `/`;
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Determine if current scenario is a follow-up feedback scenario
  // Simple logic: If last bot message had an array of items, next user message is considered feedback
  function isFeedbackScenario(): boolean {
    // Find the last bot message with items array
    for (let i = conversation.length - 1; i >= 0; i--) {
      const msg = conversation[i];
      if (msg.bot && Array.isArray(msg.bot.message) && msg.bot.message.length > 0) {
        // Found a look suggestion bot message
        return true;
      }
    }
    return false;
  }

  const startBotResponseChecking = (chatId: string) => {
    if (botResponseCheckInterval.current) {
      clearInterval(botResponseCheckInterval.current);
    }

    botResponseCheckInterval.current = setInterval(async () => {
      try {
        const chats = await getChats();
        setConversations(chats);

        const chat = chats.find((c: { id: string; }) => c.id === chatId);
        if (chat) {
          setConversation(chat.conversation);
          const lastBotMessageIndex = chat.conversation.map((msg: ConversationMessage) => !!msg.bot).lastIndexOf(true);
          if (lastBotMessageIndex !== -1) {
            const lastBotMessage = chat.conversation[lastBotMessageIndex].bot;
            if (lastBotMessage && lastBotMessage["in-progress"] == false) {
              setIsLoading(false);
              if (botResponseCheckInterval.current) {
                clearInterval(botResponseCheckInterval.current);
                botResponseCheckInterval.current = null;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chats during bot response check:', error);
      }
    }, 1000);
  };

  const sendMessage = async (message: string, botResponse?: BotResponse) => {
    if (!message.trim()) return;

    setInput('');
    setIsLoading(true);

    if (isAwaitingEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(message.trim())) {
        const email = message.trim();
        setUserData(prev => ({ ...prev, email }));
        localStorage.setItem('email', email);
        setIsAwaitingEmail(false);

        try {
          const response = await signupUser(email);
          setUserData(prev => ({ ...prev, id: response.id }));
          localStorage.setItem('id', response.id);

          if (pendingConversation.length > 0) {
            const updatedConversation = [...conversation, { user: message }, ...pendingConversation];
            setConversation(updatedConversation);
            setPendingConversation([]);
            scrollToBottom();

            const resultCheck = await checkChat(updatedConversation, userLanguage);

            const newChat = await createChat(email, updatedConversation);
            setCurrentChatId(newChat.id);
            updateChatMessages(newChat.id, updatedConversation, resultCheck.response, userLanguage);
            startBotResponseChecking(newChat.id);
            return;
          } else {
            const updatedConversation = [...conversation, { user: message }];
            setConversation(updatedConversation);
            scrollToBottom();

            const resultCheck = await checkChat(updatedConversation, userLanguage);

            const newChat = await createChat(email, updatedConversation);
            setCurrentChatId(newChat.id);
            setTimeout(() => router.replace(`/?chat=${newChat.id}`), 10000);
            updateChatMessages(newChat.id, updatedConversation, resultCheck.response, userLanguage);
            startBotResponseChecking(newChat.id);
            return;
          }
        } catch (error) {
          console.error('Error during signup or creating chat:', error);
          const botMessage: ConversationMessage = { bot: { "in-progress": false, "progress-message": "", message: "" } };
          setConversation(prev => [...prev, botMessage ]);
          setIsLoading(false);
        }
      } else {
        const botMessage: ConversationMessage = { bot: { "in-progress": false, "progress-message": "", message: getLocalizedText(userLanguage, "invalidEmail") } };
        setConversation(prev => [...prev, botMessage ]);
        setIsLoading(false);
      }
      return;
    }

    if (botResponse) {
      const userMessage: ConversationMessage = { user: message };
      const botMessage: ConversationMessage = { bot: botResponse };

      if (!userData.email) {
        const emailPrompt: ConversationMessage = { bot: { "in-progress": false, "progress-message": "", message: getLocalizedText(userLanguage, "askEmail") } };
        setConversation(prev => [...prev, userMessage, emailPrompt ]);
        setIsAwaitingEmail(true);
        setPendingConversation([botMessage]);
        setIsLoading(false);
        return;
      } else {
        const updatedConversation = [...conversation, userMessage, botMessage];
        setConversation(updatedConversation);
        setIsLoading(false);
        scrollToBottom();

        try {
          const newChat = await createChat(userData.email, updatedConversation);
          setCurrentChatId(newChat.id);
          setTimeout(() => router.replace(`/?chat=${newChat.id}`), 10000);
        } catch (error) {
          console.error('Error creating chat after example prompt:', error);
          const errorBotMessage: ConversationMessage = { bot: { "in-progress": false, "progress-message": "", message: "" } };
          setConversation(prev => [...prev, errorBotMessage ]);
          setIsLoading(false);
        }
        return;
      }
    }

    const userMessage: ConversationMessage = { user: message };
    const currentConversation = [...conversation, userMessage];
    setConversation(currentConversation);

    if (!userData.email) {
      const botMessage: ConversationMessage = { bot: { "in-progress": false, "progress-message": "", message: getLocalizedText(userLanguage, "askEmail") } };
      setConversation(prev => [...prev, botMessage ]);
      setIsAwaitingEmail(true);
      setPendingConversation([]);
      setIsLoading(false);
      return;
    }

    // Check if it's a feedback scenario
    const isFollowUp = isFeedbackScenario();

    if (!isFollowUp) {
      // Initial logic - Check preferences
      try {
        const result = await checkChat(currentConversation, userLanguage);
        if (result.response === 'SPECIFIC' || result.response === 'ABSTRACT') {
          setSearchType(result.response);

          if (currentChatId) {
            updateChatMessages(currentChatId, currentConversation, result.response, userLanguage);
            startBotResponseChecking(currentChatId);
          } else {
            try {
              await signupUser(userData.email);
              const newChat = await createChat(userData.email, currentConversation);
              setCurrentChatId(newChat.id);
              updateChatMessages(newChat.id, currentConversation, result.response, userLanguage);
              startBotResponseChecking(newChat.id);
              setTimeout(() => router.replace(`/?chat=${newChat.id}`), 10000);
            } catch (error) {
              console.error('Error starting new chat:', error);
              const botMessage: ConversationMessage = { bot: { message: "", "in-progress": false } };
              setConversation(prev => [...prev, botMessage ]);
              setIsLoading(false);
            }
          }
        } else if (result.response === 'MULTIPLE')  {
          const botMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "createChatMutipleError"), "in-progress": false } };
          setConversation(prev => [...prev, botMessage ]);
          setIsLoading(false);
        } else {
          const botMessage: ConversationMessage = { bot: { message: result.response, "in-progress": false } };
          setConversation(prev => [...prev, botMessage ]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error during checkChat:', error);
        const botMessage: ConversationMessage = { bot: { "in-progress": false, "progress-message": "", message: "" } };
        setConversation(prev => [...prev, botMessage ]);
        setIsLoading(false);
      }
    } else {
      // FOLLOW-UP scenario - call followUpChat
      if (!currentChatId) {
        // If no currentChatId, create a new chat first
        try {
          const newChat = await createChat(userData.email, currentConversation);
          setCurrentChatId(newChat.id);
          setTimeout(() => router.replace(`/?chat=${newChat.id}`), 10000);

          // Call followUpChat
          setTimeout(() => {
            updateChatMessagesFollowUp(newChat.id, currentConversation, userLanguage);
            startBotResponseChecking(newChat.id);
            scrollToBottom();
          }, 1000);         
        } catch (error) {
          console.error('Error handling follow-up chat creation:', error);
          const botMessage: ConversationMessage = { bot: { "in-progress": false, "progress-message": "", message: "" } };
          setConversation(prev => [...prev, botMessage ]);
          setIsLoading(false);
        }
      } else {
        // We have a chatId
        try {
          setTimeout(() => {
            updateChatMessagesFollowUp(currentChatId, currentConversation, userLanguage);
            startBotResponseChecking(currentChatId);
            scrollToBottom();
          }, 1000);
        } catch (error) {
          console.error('Error calling followUpChat:', error);
          setIsLoading(false);
        }
      }
    }
  };

  const handleSubmit: (e?: React.FormEvent) => Promise<void> = async (e) => {
    if (e) {
      e.preventDefault(); // Prevent the default form submission
    }
    await sendMessage(input);
  };

  const handleCountryChange = (value: string) => {
    setUserData((prev) => ({ ...prev, country: value }));
    localStorage.setItem('country', value);
  };

  const handleLogout = async () => {
    try {
      await removeUser(userData.email);
      localStorage.removeItem('country');
      localStorage.removeItem('email');
      localStorage.removeItem('profile');
      setUserData({ id : '', email: '', country: detectedDefaultCountry });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleExampleClick = async (promptKey: keyof LocalizationStrings) => {
    const promptText = getLocalizedText(userLanguage, promptKey);
    // Retrieve the hardcoded response based on promptKey and userLanguage
    const responseByPrompt = hardcodedResponses[promptKey as keyof typeof hardcodedResponses];
    const hardcodedResponse: BotResponse | undefined = responseByPrompt
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (responseByPrompt as any)[userLanguage] || responseByPrompt['brazilian_portuguese']
      : undefined;
    // Reset currentChatId to ensure a new chat is created
    setCurrentChatId(null);
    // Send the prompt text as a user message, along with the hardcoded bot response
    await sendMessage(promptText, hardcodedResponse);
  };

  const handleStarClick = (value: number) => {
    setStarRating(value);
    saveStarsFeedback(currentChatId, value);
    setShowFeedbackPopup(true);
  };

  const handleSubmitFeedback = () => {
    saveOpenFeedback(currentChatId, writtenFeedback);
    setShowFeedbackPopup(false);
  };

  const handleProfileConfirmation = () => {
    router.push('/editProfile');
  };

  // Update handleFeedbackSuggestionClick to accept a string instead of a key
  const handleFeedbackSuggestionClick = (suggestionText: string) => {
    setInput((prevInput) => prevInput ? `${prevInput} ${suggestionText}` : suggestionText);
    setIsWaitingFeedback(false);
    if(suggestionText == "Quero comprar" || suggestionText == "I want to buy") {
      sendMessage(suggestionText);
    }
  };

  const profile = (typeof window !== 'undefined') ? localStorage.getItem('profile') : null;
  const profileIsEmpty = !profile || profile === "{}";

  // **Define lastBotMessage for consistency**
  const lastBotMessage = conversation[conversation.length - 1]?.bot;

  // Helper function to process bot messages
  const processBotMessage = (message: string) => {
    // Remove the first and last newline characters (\n or \r\n)
    const trimmedMessage = message.replace(/^(\r?\n)+|(\r?\n)+$/g, '');

    // Split the message by remaining newline characters (\n or \r\n)
    const lines = trimmedMessage.split(/\r?\n/);

    // Map each line to a React fragment with a <br /> for line breaks
    return lines.map((line, idx) => (
      <React.Fragment key={idx}>
        {line}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };


  return (
    <div className="flex flex-col md:flex-row min-h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between p-4">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-4 h-4 text-gray-600" />
            </Button>
          )}
          {sidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <ChevronLeft className="w-4 h-4" />
          </Button>
          )}
          <Image
            src={logo}
            alt="Logo"
            width={40}
            height={10}
            className="object-contain cursor-pointer"
            unoptimized
            onClick={() => router.replace('/')}
          />
        <div className="w-8 h-8" />
      </div>
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-white shadow-lg flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          sidebarOpen ? "w-64" : "md:w-16"
        )}
      >
        <div className="hidden md:block flex items-center justify-between p-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center justify-between w-full bg-white">
              <div className="flex items-center">
                <Image
                  src={logo}
                  alt="Logo"
                  width={120}
                  height={30}
                  className="object-contain cursor-pointer"
                  unoptimized
                  onClick={() => router.replace('/')}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-full flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-4 h-4 bg-white" />
              </Button>
            </div>
          )}
        </div>

        <div className="pt-20 md:p-2 mb-2">
          <Button
            variant="ghost"
            onClick={handleNewChat}
            className="text-gray-600 hover:text-gray-900 flex items-center font-nunito w-full justify-start"
          >
            <PlusCircle className="w-4 h-4" />
            {sidebarOpen && getLocalizedText(userLanguage, "newChat")}
          </Button>
        </div>

        <ScrollArea className="flex-1 pb-20">
          <div className="p-2">
          {conversations
            .filter(conv => userData.id === conv.user_id)
            .sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            })
            .map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSidebarOpen(false);
                  setTimeout(() => {window.location.reload()}, 10000);
                  router.push(`/?chat=${conv.id}`);
                }}
                className={cn(
                  "w-full mb-1 rounded-lg transition-colors duration-200 focus:outline-none",
                  sidebarOpen
                    ? "p-2 hover:bg-gray-100 flex items-center gap-2"
                    : "p-2 hover:bg-gray-100 flex justify-center"
                )}
              >
                {sidebarOpen ? (
                  <>
                    <MessageSquare className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="truncate font-nunito font-medium">{conv.conversation[0]?.user}</span>
                  </>
                ) : (
                  <MessageSquare className="w-5 h-5 text-gray-600 flex-shrink-0" />
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
                  {(!profileIsEmpty) && (
                    <Button onClick={() => router.push('/editProfile')} className="bg-[#f6213f] hover:bg-[#f6213f] w-full font-nunito font-medium">
                      {getLocalizedText(userLanguage, "editProfile")}
                    </Button>
                  )}
                  {userData.email && (
                    <Button className="bg-white border border-[#f6213f] text-[#f6213f] hover:bg-[#ffeaea] font-nunito font-medium w-full" onClick={handleLogout}>
                      {getLocalizedText(userLanguage, "logout")}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:ml-64 md:ml-16" : "md:ml-16"
      )}>
        <ScrollArea className={`flex-1 ${conversation.length > 0 ? (isWaitingFeedback ? "pb-40 md:pb-32" : "pb-20") : ""}`}>
          <div className="flex-1 p-4">
            {(conversation.length === 0 && !isLoading) ? (
              <div className="w-full max-w-2xl mx-auto px-4 text-center flex flex-col justify-center items-center min-h-screen">
                <div className="relative inline-block">
                  <Image
                    src={logo}
                    alt="Fashion Search Chat Logo"
                    width={128}
                    unoptimized
                    className="mb-6 max-w-xs md:max-w-sm cursor-pointer"
                    onClick={() => router.replace('/')}
                  />
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">Beta</span>
                </div>
                <h1 className="text-xl md:text-4xl font-nunito font-medium mb-2 text-gray-800 font-raleway">{getLocalizedText(userLanguage, "callHomePrompt")}</h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 font-nunito font-medium">{getLocalizedText(userLanguage, "introHomeMessage")}</p>
                <div className="space-y-4">
                  <form onSubmit={handleSubmit} className="flex flex-row gap-2 max-w-3xl mx-auto">
                    <textarea
                      onKeyDown={handleKeyDown}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={getLocalizedText(userLanguage, "describeItem")}
                      className="flex-1 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md resize-none overflow-y-auto font-nunito font-medium"
                      rows={2}
                      style={{ width: "75%" }}
                      disabled={isLoading}
                    />
                    <button disabled={isLoading} type="submit" className="w-12 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#f6213f] hover:bg-[#d2102c] flex items-center justify-center mx-auto">
                        <ArrowUp className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  </form>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {exampleMainPromptsKeys.map((promptKey) => (
                      <Button
                        key={promptKey}
                        type="button" // Added type="button" to prevent form submission
                        variant="outline"
                        onClick={() => handleExampleClick(promptKey)}
                        className="bg-white hover:bg-gray-100 text-gray-800 transition-colors duration-200 font-nunito font-medium"
                      >
                        {getLocalizedText(userLanguage, promptKey)}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <div className="relative group w-40 h-10 mt-2">
                      <button className="bg-[#f6213f] text-white hover:bg-[#d2102c] font-medium rounded-full text-sm px-6 py-2">
                        <div className="flex items-center">
                          <Sparkles width={12} height={12} className="mr-2"/>
                          <span>{getLocalizedText(userLanguage,"comingSoonFeatures")}</span>
                        </div>
                      </button>
                      <div className="absolute hidden group-hover:flex bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 py-4 bg-white border border-gray-300 shadow-lg rounded-lg z-50">
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
              <div className="space-y-6 mt-16 md:mt-0 max-w-4xl mx-auto">
                {conversation.map((message, i) => (
                  <div
                  key={i}
                  className={cn(
                    "flex items-start gap-4",
                    message.user ? "justify-end" : "justify-start"
                  )}
                >
                  {(message.user || 
                    (message.bot && (
                      (Array.isArray(message.bot.message) && message.bot.message.length > 0) ||
                      (typeof message.bot.message === 'string' && message.bot.message.trim())
                    ))
                  ) && (
                    <div
                      className={cn(
                        "rounded-lg bg-white shadow-sm overflow-wrap break-word",
                        message.user
                          ? "p-4 bg-[#f6213f]/30 text-gray-800 max-w-[80%] font-nunito font-medium"
                          : ((message.bot && message.bot.message && (Array.isArray(message.bot.message) && message.bot.message.length > 0)) ? "max-w-[100%] font-nunito font-medium" : "p-4 max-w-[100%] font-nunito font-medium")
                      )}
                    >
                      {message.user ? (
                        <div>{message.user}</div>
                      ) : message.bot && message.bot.message ? (
                        Array.isArray(message.bot.message) && message.bot.message.length > 0 ? (
                          <div className="space-y-8">
                            {message.bot.message.map((item: BotMessage, idx: number) => {
                              const totalPrice = item?.items?.filter(x => x.itemResults[0]?.product?.price).reduce((sum, current) => sum + Number(current?.itemResults[0]?.product?.price), 0);
                              const formattedPrice = `R$${(totalPrice / 100).toFixed(2)}`;
                              
                              const hasResults = item?.items?.some(it => it.itemResults.length > 0);
                
                              return (
                                <div key={idx} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                  <div className="bg-[#f6213f] px-4 py-3 border-b border-gray-200">
                                    <div className="flex justify-between items-center">
                                      <h2 className="text-lg font-bold text-white flex items-center">
                                        {item.searchType === 'ABSTRACT' ? `Look ${idx + 1}: ${item.message} | ${formattedPrice}` : `${item.message}`}
                                      </h2>
                                    </div>
                                    <p className="text-sm text-white mt-0">
                                      {item.explanation}
                                    </p>
                                  </div>
                                  <div className="space-y-6">
                                    {hasResults ? (
                                      <ImprovedCarouselGrid items={item.items}/>
                                    ) : (
                                      !isLoading && (
                                        <div className="bg-white rounded-lg font-nunito font-medium text-center p-4">
                                          {getLocalizedText(userLanguage, "noResults")}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : typeof message.bot.message === 'string' && message.bot.message.trim() ? (
                          // Check if message is "WAITING_FEEDBACK" or "BUY"
                          message.bot.message === "WAITING_FEEDBACK" ? (
                            <div className="bg-white rounded-lg font-nunito font-medium">
                              {getLocalizedText(userLanguage, "waitingFeedback")}
                            </div>
                          ) : message.bot.message === "BUY" ? (
                            <div className="bg-white rounded-lg font-nunito font-medium">
                              {getLocalizedText(userLanguage, "waitingBuy")}
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg font-nunito font-medium">
                              {processBotMessage(message.bot.message)}
                            </div>
                          )
                        ) : !message.bot["in-progress"] && !isLoading ? (
                          <div className="bg-white rounded-lg font-nunito font-medium">
                            {getLocalizedText(userLanguage, "noResults")}
                          </div>
                        ) : null
                      ) : null}
                    </div>
                  )}
                </div>                
                ))}
                {isLoading && (
                  <div className="flex items-center gap-4 justify-start p-4">
                    <div className="relative w-12 h-12 md:w-12 md:h-12 flex-shrink-0">
                      <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-ping" />
                      <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-spin" />
                      <Sparkles className="absolute inset-0 w-5 h-5 md:w-6 md:h-6 text-[#f6213f] m-auto" />
                    </div>
                    <span className="text-gray-500 text-base md:text-lg font-medium font-nunito flex-1">
                      {(() => {
                        if (lastBotMessage && lastBotMessage["progress-message"]) {
                          return lastBotMessage["progress-message"];
                        } else {
                          return getLocalizedText(userLanguage, "thinking");
                        }
                      })()}
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {conversation.length > 0 && (
          <div className="fixed bottom-0 left-0 md:left-16 right-0 p-4 bg-white border-t border-gray-200">
            {showProfilePrompt && !hasClosedProfilePrompt && profileIsEmpty && !isLoading && conversation.some(message => Array.isArray(message?.bot?.message)) ? (
              <div className="flex flex-col items-center space-y-2">
                <p className="font-nunito font-medium text-center mb-2 text-gray-800">
                  {getLocalizedText(userLanguage, "profilePromptBetterResults")}
                </p>
                <div className='flex gap-x-2'>
                  <Button
                    onClick={() => {setShowProfilePrompt(false); setHasClosedProfilePrompt(true);}}
                    className="bg-white border border-[#f6213f] text-[#f6213f] hover:bg-[#ffeaea] font-nunito font-medium"
                  >
                    {getLocalizedText(userLanguage, "dismissProfileRedirect")}
                  </Button>
              
                  <Button
                    onClick={handleProfileConfirmation}
                    className="bg-[#f6213f] hover:bg-[#d2102c] text-white font-nunito font-medium"
                  >
                    {getLocalizedText(userLanguage, "confirmProfileRedirect")}
                  </Button>
                </div>
              </div>
            ) : showFeedbackForm ? (
              <div className="flex flex-col items-center">
                <p className="text-gray-800 mb-2 font-nunito font-medium">
                  {getLocalizedText(userLanguage, "feedbackPrompt")}
                </p>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleStarClick(value)}
                      className="focus:outline-none"
                      type="button" // Added type="button" to prevent form submission
                    >
                      <Star
                        className={cn(
                          "w-8 h-8",
                          value <= (starRating || 0) ? "text-yellow-500" : "text-gray-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
                {showFeedbackPopup && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-md w-80">
                      <p className="mb-4 font-nunito font-medium">
                        {getLocalizedText(userLanguage, "feedbackPopupPrompt")}
                      </p>
                      <textarea
                        value={writtenFeedback}
                        onChange={(e) => setWrittenFeedback(e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md font-nunito font-medium"
                        placeholder={getLocalizedText(userLanguage, "feedbackPlaceholder")}
                      />
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowFeedbackPopup(false)}>
                          {getLocalizedText(userLanguage, "cancelFeedback")}
                        </Button>
                        <Button onClick={handleSubmitFeedback}>
                          {getLocalizedText(userLanguage, "submitFeedback")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className={`flex flex-col gap-4 max-w-3xl mx-auto`}
              >
                {/* Suggestions Container */}
                <div className="w-full flex flex-wrap justify-center gap-2">
                  {(isWaitingFeedback && searchType && conversation.filter(message => message.bot && message.bot.message == "WAITING_FEEDBACK").length > 1) && (
                    <button
                      className="bg-white border border-[#f6213f] text-[#f6213f] hover:bg-[#ffeaea] transition-colors duration-200 font-nunito text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-2"
                      onClick={async () => {
                        setIsLoading(true);
                        setTimeout(() => {
                          scrollToBottom();
                          undoLastChatMessages(currentChatId || '');
                          setTimeout(() => {
                            getChats().then(chats => {
                              const updatedChat = chats.find((currentChat: { id: string | null; }) => currentChat.id === currentChatId);
                              setConversation(updatedChat ? updatedChat.conversation : []);
                              setIsLoading(false);
                            });
                          }, 500);
                        }, 500);
                      }}
                    >
                      <Undo size={16} />
                      <span className="text-xs">{getLocalizedText(userLanguage, 'goBackResponse')}</span>
                    </button>
                  )}
                  {(isWaitingFeedback && searchType && conversation.filter(message => message.bot && message.bot.message == "WAITING_FEEDBACK").length > 0) && (
                    <button
                    className="bg-[#f6213f] hover:bg-[#d2102c] text-white transition-colors duration-200 font-nunito text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-2"
                      onClick={() => handleFeedbackSuggestionClick((() => {
                        const text = getLocalizedText(userLanguage, searchType === "ABSTRACT" ? 'lovedItLook' : 'lovedItItem') || '';
                        const keyword = searchType === "ABSTRACT" ? 'look...' : '';
                        const regex = new RegExp(`(?:\\b\\w+\\b)\\s+${keyword}`, 'i');
                        const match = text.match(regex);
                        return match ? text.substring(0, match.index).trim() : text || getLocalizedText(userLanguage, 'lovedItItem');
                      })())}
                    >
                      <ShoppingCart size={16} className="text-white" />
                      <span className="text-xs">
                        {(() => {
                          const text = getLocalizedText(userLanguage, searchType === "ABSTRACT" ? 'lovedItLook' : 'lovedItItem') || '';
                          const keyword = searchType === "ABSTRACT" ? 'look...' : 'item';
                          const regex = new RegExp(`(?:\\b\\w+\\b)\\s+${keyword}`, 'i');
                          const match = text.match(regex);
                          return match ? text.substring(0, match.index).trim() : text || getLocalizedText(userLanguage, 'lovedItItem');
                        })()}
                      </span>
                    </button>
                  )}
                  {(isWaitingFeedback && searchType) && feedbackSuggestionsKeys.map((suggestionText, index) => (
                    <button
                      key={index} // Using index as key since suggestions are static
                      type="button" // Added type="button" to prevent form submission
                      onClick={() => handleFeedbackSuggestionClick(conversation.filter(message => message.bot && Array.isArray(message.bot.message)).length == 1 ? getLocalizedText(userLanguage, suggestionText as keyof LocalizationStrings) : (() => {
                        const text = getLocalizedText(userLanguage, suggestionText as keyof LocalizationStrings) || '';
                        const keyword = searchType === "ABSTRACT" ? 'look...' : 'item';
                        const regex = new RegExp(`(?:\\b\\w+\\b)\\s+${keyword}`, 'i');
                        const match = text.match(regex);
                        return (match
                          ? text.substring(0, match.index).trim()
                          : text || getLocalizedText(userLanguage, 'lovedItItem') || 'Fallback Text') + (((conversation.filter(message => message.bot && message.bot.message == "WAITING_FEEDBACK").length > 1) && (suggestionText != getLocalizedText(userLanguage, suggestionText as keyof LocalizationStrings))) ? "..." : "");
                      })())}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-nunito text-xs px-3 py-1 rounded-full shadow-sm"
                    >
                      {conversation.filter(message => message.bot && Array.isArray(message.bot.message)).length == 1 ? getLocalizedText(userLanguage, suggestionText as keyof LocalizationStrings) : (() => {
                        const text = getLocalizedText(userLanguage, suggestionText as keyof LocalizationStrings) || '';
                        const keyword = searchType === "ABSTRACT" ? 'look...' : 'item';
                        const regex = new RegExp(`(?:\\b\\w+\\b)\\s+${keyword}`, 'i');
                        const match = text.match(regex);
                        return (match
                          ? text.substring(0, match.index).trim()
                          : text || getLocalizedText(userLanguage, 'lovedItItem') || 'Fallback Text') + ((conversation.filter(message => message.bot && message.bot.message == "WAITING_FEEDBACK").length > 1 && (suggestionText != getLocalizedText(userLanguage, suggestionText as keyof LocalizationStrings))) ? "..." : "");
                      })()}
                    </button>
                  ))}
                </div>

                {/* Input Area Container */}
                <div className="w-full flex flex-row gap-2">
                  {/* Textarea */}
                  <textarea
                    onKeyDown={handleKeyDown}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={getLocalizedText(userLanguage, 'describeItem')}
                    className="flex-1 bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#f6213f] p-2 rounded-md resize-none overflow-y-auto font-nunito font-medium"
                    rows={1}
                    disabled={isLoading}
                  />

                  {/* Submit Button */}
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="w-12 flex-shrink-0 flex items-end justify-end"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#f6213f] hover:bg-[#d2102c] flex items-center justify-center">
                      <ArrowUp className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}