"use client";

// Import statements
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  MessageSquare,
  PlusCircle,
  Settings,
  Sparkles,
  User
} from "lucide-react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  API_BASE_URL,
  checkChat,
  createChat,
  getChats,
  removeUser,
  signupUser,
} from '../lib/api';
import { getLocalizedText, getUserLanguage, LocalizationStrings } from '../lib/localization';

import React from 'react';
import logo from '/public/images/logo.png';

// Updated TypeScript Interfaces to match the new backend response
interface ConversationMessage {
  user?: string;
  bot?: BotResponse;
}

interface BotResponse {
  inProgress: boolean;
  progressMessage?: string;
  message: BotMessage[] | string;
}

interface BotMessage {
  lookNumber: number;
  searchType: string;
  preferences: string;
  message: string;
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
  email: string;
  country: string;
}

// Mapping of time zones to countries
const timeZoneCityToCountry: { [key: string]: string } = {
  "New York": "us",
  "Los Angeles": "us",
  "Sao Paulo": "br",
};

// Keys for example prompts based on localization
const exampleMainPromptsKeys: (keyof LocalizationStrings)[] = [
  "exampleMainPrompt1",
  "exampleMainPrompt2",
  "exampleMainPrompt3",
  "exampleMainPrompt4"
];

export function Carousel({ children }: { children: React.ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const total = React.Children.count(children)

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1))
  }

  const next = () => {
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
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

// Updated ProductCard component to handle the new product structure
const ProductCard = ({ product, explanation, visitProductLabel }: { product: Product; explanation: string, visitProductLabel: string }) => {
  const [selectedImage, setSelectedImage] = useState(product?.image);
  if (!product) return null;

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg';
  };

  return (
    <Card className="w-full max-w-sm md:max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          {product.title.charAt(0).toUpperCase() + product.title.slice(1).toLowerCase()}
        </div>
        <CardDescription className="font-nunito font-small">
          {explanation}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-square relative overflow-hidden rounded-lg">
          <img
            src={selectedImage}
            alt={product.title || "Product Image"}
            className="object-cover w-full h-full"
            onError={handleError}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        {product.images_urls && (
          <div className="overflow-x-auto w-full whitespace-nowrap rounded-lg h-24">
            <div className="flex gap-2 p-2">
              {Array.from(new Set(product.images_urls)).map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 flex-shrink-0 cursor-pointer hover:opacity-75 hover:border-4 hover:border-transparent" onClick={() => handleImageClick(url)}>
                  <img
                    src={url}
                    alt={`${product.title} ${idx + 1}`}
                    className="object-cover w-full h-full rounded-md"
                    onError={handleError}
                  />
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
              {visitProductLabel}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Main Functional Component
export function FashionSearchChat() {
  const router = useRouter();

  // Determine the user's country based on their time zone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const city = timeZone.split('/').pop()?.replace('_', ' ');
  const detectedDefaultCountry = timeZoneCityToCountry[city || ''] || 'us';

  // State Management
  const [conversations, setConversations] = useState<{ id: string; conversation: ConversationMessage[] }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchType, setSearchType] = useState('SPECIFIC');
  const [userData, setUserData] = useState<UserData>({
    email: '',
    country: 'br', // default value
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // References for polling and timeouts
  const botResponseCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const botResponseTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isAwaitingEmail, setIsAwaitingEmail] = useState(false);
  const [pendingConversation, setPendingConversation] = useState<ConversationMessage[]>([]);

  const [chatIdFromUrl, setChatIdFromUrl] = useState<string | null>(null);

  // Effect to capture chat ID from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const chatId = params.get('chat');
      setChatIdFromUrl(chatId);
    }
  }, []);

  // Handle Enter key for sending messages
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Get user language based on country
  const userLanguage = getUserLanguage(userData.country);

  // Load conversation by chat ID
  const loadConversationById = useCallback((chatId: string) => {
    const chat = conversations.find(c => c.id === chatId);
    if (chat) {
      setConversation(chat.conversation);
    }
  }, [conversations]);

  // Fetch all chats from the backend
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

  // Initialize user data from localStorage
  useEffect(() => {
    const storedCountry = localStorage.getItem('country') || detectedDefaultCountry;
    const storedEmail = localStorage.getItem('email');
    setUserData({
      email: storedEmail || '',
      country: storedCountry,
    });
  }, []);

  // Fetch chats on component mount
  useEffect(() => {
    fetchChats();
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      setUserData((prev) => ({ ...prev, email: storedEmail }));
    }
  }, [fetchChats]);

  // Load conversation if chat ID is present in URL
  useEffect(() => {
    if (chatIdFromUrl) {
      setCurrentChatId(chatIdFromUrl);
      loadConversationById(chatIdFromUrl);
    }
  }, [chatIdFromUrl, conversations, loadConversationById]);

  // Scroll to the bottom of the chat whenever the conversation updates
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Cleanup polling intervals and timeouts on component unmount
  useEffect(() => {
    return () => {
      if (botResponseCheckInterval.current) {
        clearInterval(botResponseCheckInterval.current);
      }
      if (botResponseTimeout.current) {
        clearTimeout(botResponseTimeout.current);
      }
    };
  }, []);

  // Function to start a new chat
  const handleNewChat = async () => {
    setCurrentChatId(null);
    setConversation([]);
    router.push('/');
  };

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Sends a message either by creating a new chat or updating an existing one.
   * @param message The message string to send.
   * @param botResponse Optional hardcoded bot response for example prompts.
   */
  const sendMessage = async (message: string, botResponse?: BotResponse) => {
    if (!message.trim()) return;

    setInput('');
    setIsLoading(true);

    if (isAwaitingEmail) {
      // Awaiting user's email input
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(message.trim())) {
        // Valid email
        const email = message.trim();
        setUserData(prev => ({ ...prev, email }));
        localStorage.setItem('email', email);
        setIsAwaitingEmail(false);

        try {
          // Sign up the user
          await signupUser(email);

          if (pendingConversation.length > 0) {
            // Add pending conversation
            const updatedConversation = [...conversation, { user: message }, ...pendingConversation];
            setConversation(updatedConversation);
            setPendingConversation([]);
            scrollToBottom();

            // Create chat
            const newChat = await createChat(email, updatedConversation);
            setCurrentChatId(newChat.id);
            setTimeout(() => {
              updateChatMessages(newChat.id, updatedConversation, searchType);
              startBotResponseChecking(newChat.id);
            }, 1000);
            return;
          } else {
            // No pending messages
            // Add user's email message to conversation
            const updatedConversation = [...conversation, { user: message }];
            setConversation(updatedConversation);
            scrollToBottom();

            // Create chat
            try {
              const newChat = await createChat(email, updatedConversation);
              setCurrentChatId(newChat.id);
              router.replace(`/?chat=${newChat.id}`);
              setTimeout(() => {
                updateChatMessages(newChat.id, updatedConversation, searchType);
                startBotResponseChecking(newChat.id);
              }, 1000);
            } catch (error) {
              console.error('Error creating chat:', error);
              const errorBotMessage: ConversationMessage = { bot: { inProgress: false, progressMessage: "", message: "" } };
              setConversation(prev => [...prev, errorBotMessage]);
              setIsLoading(false);
            }
            return;
          }
        } catch (error) {
          console.error('Error during signup or creating chat:', error);
          const botMessage: ConversationMessage = { bot: { inProgress: false, progressMessage: "", message: "" } };
          setConversation(prev => [...prev, botMessage ]);
          setIsLoading(false);
        }
      } else {
        // Invalid email
        const botMessage: ConversationMessage = { bot: { inProgress: false, progressMessage: "", message: getLocalizedText(userLanguage, "invalidEmail") } };
        setConversation(prev => [...prev, botMessage ]);
        setIsLoading(false);
      }
      return;
    }

    if (botResponse) {
      // This is an example prompt with a hardcoded bot response
      const userMessage: ConversationMessage = { user: message };
      const botMessage: ConversationMessage = { bot: botResponse };

      if (!userData.email) {
        // Ask for email
        const emailPrompt: ConversationMessage = { bot: { inProgress: false, progressMessage: "", message: getLocalizedText(userLanguage, "askEmail") } };
        setConversation(prev => [...prev, userMessage, emailPrompt ]);
        setIsAwaitingEmail(true);
        // Store pending conversation
        setPendingConversation([botMessage]);
        setIsLoading(false);
        return;
      } else {
        // Email is set, proceed to add message and create chat
        const updatedConversation = [...conversation, userMessage, botMessage];
        setConversation(updatedConversation);
        setIsLoading(false);
        scrollToBottom();

        // Create chat
        try {
          const newChat = await createChat(userData.email, updatedConversation);
          setCurrentChatId(newChat.id);
          router.replace(`/?chat=${newChat.id}`);
        } catch (error) {
          console.error('Error creating chat after example prompt:', error);
          const errorBotMessage: ConversationMessage = { bot: { inProgress: false, progressMessage: "", message: "" } };
          setConversation(prev => [...prev, errorBotMessage ]);
          setIsLoading(false);
        }
        return;
      }
    }

    // Proceed with normal message handling
    const userMessage: ConversationMessage = { user: message };
    const currentConversation = [...conversation, userMessage];
    setConversation(currentConversation);

    if (!userData.email) {
      // Ask for email
      const botMessage: ConversationMessage = { bot: { inProgress: false, progressMessage: "", message: getLocalizedText(userLanguage, "askEmail") } };
      setConversation(prev => [...prev, botMessage ]);
      setIsAwaitingEmail(true);
      setPendingConversation([]);
      setIsLoading(false);
      return;
    }

    // Check if enough preferences
    const result = await checkChat(currentConversation, userLanguage);
    
    if (result.response == 'SPECIFIC' || result.response == 'ABSTRACT') {
      setSearchType(result.response);

      if (currentChatId) {
        // Update chat
        updateChatMessages(currentChatId, currentConversation, result.response);
        startBotResponseChecking(currentChatId);
      } else {
        try {
          // Create chat
          await signupUser(userData.email);
          const newChat = await createChat(userData.email, currentConversation);
          setCurrentChatId(newChat.id);
          updateChatMessages(newChat.id, currentConversation, result.response);
          startBotResponseChecking(newChat.id);
          router.replace(`/?chat=${newChat.id}`);
        } catch (error) {
          console.error('Error starting new chat:', error);
          const botMessage: ConversationMessage = { bot: { message: "", "inProgress": false } };
          setConversation(prev => [...prev, botMessage ]);
          setIsLoading(false);
        }
      }
    } else if (result.response === 'MULTIPLE')  {
      // Display result.response message on the chat
      const botMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "createChatMutipleError"), "inProgress": false } };
      setConversation(prev => [...prev, botMessage ]);
      setIsLoading(false);
    } else {
      // Display result.response message on the chat
      const botMessage: ConversationMessage = { bot: { message: result.response, "inProgress": false } };
      setConversation(prev => [...prev, botMessage ]);
      setIsLoading(false);
    }
  };

  /**
   * Updates the chat message on the server and starts checking for bot responses.
   * @param chatId The ID of the chat to update.
   * @param updatedConversation The updated conversation array.
   * @param searchType The type of search (e.g., SPECIFIC, ABSTRACT).
   */
  const updateChatMessages = (chatId: string, updatedConversation: ConversationMessage[], searchType: string) => {
    // Call updateChat API and handle the new response schema
    fetch(`${API_BASE_URL}/updateChat/${chatId}`, { // Updated URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation: updatedConversation, searchType: searchType, language: userLanguage })
    })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) {
        // Handle errors based on new error response schema
        throw data;
      }
      // Update the conversation state with the latest data
      if (data.status === "success" && data.data && data.data.conversation) {
        setConversation(data.data.conversation);
      }
    })
    .catch(error => {
      console.error('Error updating chat:', error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (error.errors && Array.isArray(error.errors)) {
        const botMessage: ConversationMessage = {
          bot: {
            inProgress: false,
            progressMessage: "",
            message: getLocalizedText(userLanguage, "updateChatError")
          }
        };
        setConversation(prev => [...prev, botMessage ]);
      } else {
        // Generic error message
        const botMessage: ConversationMessage = { bot: { inProgress: false, progressMessage: "", message: getLocalizedText(userLanguage, "updateChatError") } };
        setConversation(prev => [...prev, botMessage ]);
      }
    });
  };

  /**
   * Starts polling the backend to check for bot responses.
   * @param chatId The ID of the chat to poll.
   */
  const startBotResponseChecking = (chatId: string) => {
    // Clear any existing intervals or timeouts
    if (botResponseCheckInterval.current) {
      clearInterval(botResponseCheckInterval.current);
    }
    if (botResponseTimeout.current) {
      clearTimeout(botResponseTimeout.current);
    }

    // Start the interval to check for bot responses every 5 seconds
    botResponseCheckInterval.current = setInterval(async () => {
      try {
        const chats = await getChats();
        setConversations(chats);

        // Find the current chat
        const chat = chats.find((c: { id: string; }) => c.id === chatId);
        if (chat) {
          // Update conversation state
          setConversation(chat.conversation);
          const lastBotMessageIndex = chat.conversation.map((msg: ConversationMessage) => !!msg.bot).lastIndexOf(true);
          if (lastBotMessageIndex !== -1) {
            const lastBotMessage = chat.conversation[lastBotMessageIndex].bot;
            // Check "inProgress" field inside bot
            if (lastBotMessage && lastBotMessage["in-progress"] == false) {
              // Bot has finished processing, stop polling
              setIsLoading(false);
              stopBotResponseChecking();
            }
            // Else, continue polling
          } else {
            // No bot message yet, continue polling
          }
        }
      } catch (error) {
        console.error('Error fetching chats during bot response check:', error);
      }
    }, 5000); // Every 5 seconds
  };

  /**
   * Stops polling for bot responses.
   */
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

  /**
  * Handles example prompt clicks by sending the prompt and setting a hardcoded bot response.
  * @param promptKey The key of the example prompt.
  */
  const handleExampleClick = async (promptKey: keyof LocalizationStrings) => {
    const promptText = getLocalizedText(userLanguage, promptKey);
    let hardcodedResponse: BotResponse | undefined = undefined;

    // Define hardcoded responses based on promptKey and userLanguage
    switch (promptKey) {
      case "exampleMainPrompt1": // Pink Floral Print Short Dress with Sleeves
        if (userLanguage === "brazilian_portuguese") {
          hardcodedResponse = {
            inProgress: false,
            progressMessage: "",
            message: [
              {
                lookNumber: 1,
                searchType: "SPECIFIC",
                preferences: "Vestido curto de estampa floral rosa com mangas",
                message: "Vestido curto de estampa floral rosa com mangas",
                items: [
                  {
                    itemName: "Vestido Floral",
                    itemResults: [
                      {
                        lookNumber: 1,
                        score: 95,
                        product: {
                          id: "prod_001",
                          title: "Vestido Mini Floral Lightburst com Recortes - Zimmermann",
                          price: 299.99,
                          link: "https://www.zimmermann.com/us/tops-tank-cami/mini-dresses/lightburst-cut-out-mini-dress-red-floral.html",
                          image: "https://www.zimmermann.com/media/catalog/product/3/_/3.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                          images_urls: [
                            "https://www.zimmermann.com/media/catalog/product/3/_/3.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                            "https://www.zimmermann.com/media/catalog/product/3/_/3.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755"
                          ],
                          snippet: "Este vestido mini de floral com recortes elegantes é perfeito para ocasiões especiais, oferecendo um toque de sofisticação e estilo.",
                          short_description: "Vestido mini de 4 pessoas com fácil montagem.",
                          long_description: "Este vestido mini de camping para 4 pessoas é projetado para conforto e durabilidade...",
                          image_attributes: {
                            waterproof: true,
                            color: "Green"
                          },
                          image_classifications: {
                            type: "Vestido",
                            usage: "Festas"
                          },
                          variants: [
                            {
                              variantId: "var_001a",
                              color: "Rosa",
                              price: 299.99
                            },
                            {
                              variantId: "var_001b",
                              color: "Azul",
                              price: 299.99
                            }
                          ]
                        },
                        explanation: "Alta pontuação devido à excelente classificação à prova d'água e interior espaçoso."
                      },
                      // ... more product results
                    ]
                  }
                  // ... more items
                ]
              }
              // ... more message
            ]
          };
        } else {
          // Hardcoded responses for other languages (e.g., English)
          hardcodedResponse = {
            inProgress: false,
            progressMessage: "",
            message: [
              {
                lookNumber: 1,
                searchType: "SPECIFIC",
                preferences: "Pink Floral Print Short Dress with Sleeves",
                message: "Pink Floral Print Short Dress with Sleeves",
                items: [
                  {
                    itemName: "Floral Dress",
                    itemResults: [
                      {
                        lookNumber: 1,
                        score: 95,
                        product: {
                          id: "prod_001",
                          title: "Lightburst Cut-Out Mini Dress Red Floral - Zimmermann",
                          price: 299.99,
                          link: "https://www.zimmermann.com/us/tops-tank-cami/mini-dresses/lightburst-cut-out-mini-dress-red-floral.html",
                          image: "https://www.zimmermann.com/media/catalog/product/1/_/1.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                          images_urls: [
                            "https://www.zimmermann.com/media/catalog/product/1/_/1.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                            "https://www.zimmermann.com/media/catalog/product/3/_/3.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755"
                          ],
                          snippet: "A spacious dress perfect for special occasions, offering a touch of sophistication and style.",
                          short_description: "Spacious 4-person tent with easy setup.",
                          long_description: "This 4-person camping tent is designed for comfort and durability...",
                          image_attributes: {
                            waterproof: true,
                            color: "Green"
                          },
                          image_classifications: {
                            type: "Dress",
                            usage: "Parties"
                          },
                          variants: [
                            {
                              variantId: "var_001a",
                              color: "Pink",
                              price: 299.99
                            },
                            {
                              variantId: "var_001b",
                              color: "Blue",
                              price: 299.99
                            }
                          ]
                        },
                        explanation: "High score due to excellent waterproof rating and spacious interior."
                      },
                      // ... more product results
                    ]
                  }
                  // ... more items
                ]
              }
              // ... more message
            ]
          };
        }
        break;

      case "exampleMainPrompt2": // Military Green Cargo Pants with Side Pockets
        if (userLanguage === "brazilian_portuguese") {
          hardcodedResponse = {
            inProgress: false,
            progressMessage: "",
            message: [
              {
                lookNumber: 1,
                searchType: "SPECIFIC",
                preferences: "Calças cargo verde militar com bolsos laterais",
                message: "Calças cargo verde militar com bolsos laterais",
                items: [
                  {
                    itemName: "Calças Cargo",
                    itemResults: [
                      {
                        lookNumber: 1,
                        score: 95,
                        product: {
                          id: "prod_002",
                          title: "Calças Cargo em Algodão e Linho - Celine",
                          price: 399.99,
                          link: "https://www.celine.com/en-us/celine-shop-women/ready-to-wear/pants-and-shorts/cargo-pants-in-cotton-linen-2Z552219I.02MK.html",
                          image: "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_1_SS24_W.jpg?twic=v1/cover=1:1/resize-max=900",
                          images_urls: [
                            "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_1_SS24_W.jpg?twic=v1/cover=1:1/resize-max=900",
                            "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_3_SS24_W.jpg?twic=v1/cover=820x820/max=2000"
                          ],
                          snippet: "Calças cargo elegantes em algodão e linho, com bolsos laterais profundos para um estilo utilitário sofisticado.",
                          short_description: "Calças cargo elegantes em algodão e linho.",
                          long_description: "Estas calças cargo combinam funcionalidade com estilo, perfeitas para um visual urbano e moderno...",
                          image_attributes: {
                            waterproof: true,
                            color: "Green"
                          },
                          image_classifications: {
                            type: "Pants",
                            usage: "Urban"
                          },
                          variants: [
                            {
                              variantId: "var_002a",
                              color: "Green",
                              price: 399.99
                            },
                            {
                              variantId: "var_002b",
                              color: "Brown",
                              price: 399.99
                            }
                          ]
                        },
                        explanation: "Estas calças cargo combinam funcionalidade com estilo, perfeitas para um visual urbano e moderno."
                      },
                      // ... more product results
                    ]
                  }
                  // ... more items
                ]
              }
              // ... more message
            ]
          };
        } else {
          // Hardcoded responses for other languages (e.g., English)
          hardcodedResponse = {
            inProgress: false,
            progressMessage: "",
            message: [
              {
                lookNumber: 1,
                searchType: "SPECIFIC",
                preferences: "Military Green Cargo Pants with Side Pockets",
                message: "Military Green Cargo Pants with Side Pockets",
                items: [
                  {
                    itemName: "Cargo Pants",
                    itemResults: [
                      {
                        lookNumber: 1,
                        score: 95,
                        product: {
                          id: "prod_002",
                          title: "Cotton Linen Cargo Pants - Celine",
                          price: 399.99,
                          link: "https://www.celine.com/en-us/celine-shop-women/ready-to-wear/pants-and-shorts/cargo-pants-in-cotton-linen-2Z552219I.02MK.html",
                          image: "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_1_SS24_W.jpg?twic=v1/cover=1:1/resize-max=900",
                          images_urls: [
                            "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_1_SS24_W.jpg?twic=v1/cover=1:1/resize-max=900",
                            "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_3_SS24_W.jpg?twic=v1/cover=820x820/max=2000"
                          ],
                          snippet: "Elegant cotton and linen cargo pants with deep side pockets for a sophisticated utilitarian style.",
                          short_description: "Elegant cotton and linen cargo pants.",
                          long_description: "These cargo pants blend functionality with style, perfect for an urban and modern look...",
                          image_attributes: {
                            waterproof: true,
                            color: "Green"
                          },
                          image_classifications: {
                            type: "Pants",
                            usage: "Urban"
                          },
                          variants: [
                            {
                              variantId: "var_002a",
                              color: "Green",
                              price: 399.99
                            },
                            {
                              variantId: "var_002b",
                              color: "Brown",
                              price: 399.99
                            }
                          ]
                        },
                        explanation: "These cargo pants blend functionality with style, perfect for an urban and modern look."
                      },
                      // ... more product results
                    ]
                  }
                  // ... more items
                ]
              }
              // ... more message
            ]
          };
        }
        break;

      case "exampleMainPrompt3": // Black Tweed Blazer with Golden Buttons
        if (userLanguage === "brazilian_portuguese") {
          hardcodedResponse = {
            inProgress: false,
            progressMessage: "",
            message: [
              {
                lookNumber: 1,
                searchType: "SPECIFIC",
                preferences: "Blazer tweed preto com botões dourados",
                message: "Blazer tweed preto com botões dourados",
                items: [
                  {
                    itemName: "Blazer Tweed",
                    itemResults: [
                      {
                        lookNumber: 1,
                        score: 95,
                        product: {
                          id: "prod_003",
                          title: "Blazer Tweed com Botões Dourados - Balmain",
                          price: 599.99,
                          link: "https://us.balmain.com/en/p/buttons-tweed-jacket-DF1SK249KG430PA.html",
                          image: "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAF?_i=AG",
                          images_urls: [
                            "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAF?_i=AG",
                            "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAA?_i=AG"
                          ],
                          snippet: "Blazer de tweed preto com botões dourados, combinando tradição com um toque de luxo moderno.",
                          short_description: "Blazer de tweed elegante com botões dourados.",
                          long_description: "Este blazer de tweed preto é perfeito para adicionar um toque sofisticado e elegante ao seu guarda-roupa formal...",
                          image_attributes: {
                            waterproof: true,
                            color: "Black"
                          },
                          image_classifications: {
                            type: "Blazer",
                            usage: "Formal"
                          },
                          variants: [
                            {
                              variantId: "var_003a",
                              color: "Black",
                              price: 599.99
                            },
                            {
                              variantId: "var_003b",
                              color: "Navy",
                              price: 599.99
                            }
                          ]
                        },
                        explanation: "Este blazer tweed preto é perfeito para adicionar um toque sofisticado e elegante ao seu guarda-roupa formal."
                      },
                      // ... more product results
                    ]
                  }
                  // ... more items
                ]
              }
              // ... more message
            ]
          };
        } else {
          // Hardcoded responses for other languages (e.g., English)
          hardcodedResponse = {
            inProgress: false,
            progressMessage: "",
            message: [
              {
                lookNumber: 1,
                searchType: "SPECIFIC",
                preferences: "Black Tweed Blazer with Golden Buttons",
                message: "Black Tweed Blazer with Golden Buttons",
                items: [
                  {
                    itemName: "Tweed Blazer",
                    itemResults: [
                      {
                        lookNumber: 1,
                        score: 95,
                        product: {
                          id: "prod_003",
                          title: "Black Tweed Blazer with Golden Buttons - Balmain",
                          price: 599.99,
                          link: "https://us.balmain.com/en/p/buttons-tweed-jacket-DF1SK249KG430PA.html",
                          image: "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAF?_i=AG",
                          images_urls: [
                            "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAF?_i=AG",
                            "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAA?_i=AG"
                          ],
                          snippet: "Black tweed blazer with golden buttons, blending tradition with a touch of modern luxury.",
                          short_description: "Elegant tweed blazer with golden buttons.",
                          long_description: "This black tweed blazer is perfect for adding a sophisticated and elegant touch to your formal wardrobe...",
                          image_attributes: {
                            waterproof: true,
                            color: "Black"
                          },
                          image_classifications: {
                            type: "Blazer",
                            usage: "Formal"
                          },
                          variants: [
                            {
                              variantId: "var_003a",
                              color: "Black",
                              price: 599.99
                            },
                            {
                              variantId: "var_003b",
                              color: "Navy",
                              price: 599.99
                            }
                          ]
                        },
                        explanation: "This black tweed blazer is perfect for adding a sophisticated and elegant touch to your formal wardrobe."
                      },
                      // ... more product results
                    ]
                  }
                  // ... more items
                ]
              }
              // ... more message
            ]
          };
        }
        break;

      case "exampleMainPrompt4": // Metallic Mesh Sleeveless Top
        if (userLanguage === "brazilian_portuguese") {
          hardcodedResponse = {
            inProgress: false,
            progressMessage: "",
            message: [
              {
                lookNumber: 1,
                searchType: "SPECIFIC",
                preferences: "Top sem mangas de malha metálica",
                message: "Top sem mangas de malha metálica",
                items: [
                  {
                    itemName: "Top Metálico",
                    itemResults: [
                      {
                        lookNumber: 1,
                        score: 95,
                        product: {
                          id: "prod_004",
                          title: "Top Camisola de Malha Metálica - Versace",
                          price: 199.99,
                          link: "https://www.versace.com/us/en/women/clothing/shirts-tops/metal-mesh-camisole-top/1017450-1A12739_1X050.html",
                          image: "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwc64eb860/original/90_1017450-1A12739_1X050_18_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_0_2.jpg?sw=850&q=85&strip=true",
                          images_urls: [
                            "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwc64eb860/original/90_1017450-1A12739_1X050_18_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_0_2.jpg?sw=850&q=85&strip=true",
                            "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwaa0ecbf1/original/90_1017450-1A12739_1X050_10_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_1_2.jpg?sw=850&q=85&strip=true"
                          ],
                          snippet: "Top camisola sem mangas de malha metálica, perfeito para um visual moderno e ousado.",
                          short_description: "Top camisola sem mangas de malha metálica.",
                          long_description: "Este top sem mangas de malha metálica adiciona um toque futurista e elegante ao seu guarda-roupa, ideal para eventos noturnos...",
                          image_attributes: {
                            waterproof: true,
                            color: "Silver"
                          },
                          image_classifications: {
                            type: "Top",
                            usage: "Evening"
                          },
                          variants: [
                            {
                              variantId: "var_004a",
                              color: "Silver",
                              price: 199.99
                            },
                            {
                              variantId: "var_004b",
                              color: "Gold",
                              price: 199.99
                            }
                          ]
                        },
                        explanation: "Este top sem mangas de malha metálica adiciona um toque futurista e elegante ao seu guarda-roupa, ideal para eventos noturnos."
                      },
                      // ... more product results
                    ]
                  }
                  // ... more items
                ]
              }
              // ... more message
            ]
          };
        } else {
          // Hardcoded responses for other languages (e.g., English)
          hardcodedResponse = {
            inProgress: false,
            progressMessage: "",
            message: [
              {
                lookNumber: 1,
                searchType: "SPECIFIC",
                preferences: "Metallic Mesh Sleeveless Top",
                message: "Metallic Mesh Sleeveless Top",
                items: [
                  {
                    itemName: "Metallic Top",
                    itemResults: [
                      {
                        lookNumber: 1,
                        score: 95,
                        product: {
                          id: "prod_004",
                          title: "Metallic Mesh Sleeveless Camisole Top - Versace",
                          price: 199.99,
                          link: "https://www.versace.com/us/en/women/clothing/shirts-tops/metal-mesh-camisole-top/1017450-1A12739_1X050.html",
                          image: "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwc64eb860/original/90_1017450-1A12739_1X050_18_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_0_2.jpg?sw=850&q=85&strip=true",
                          images_urls: [
                            "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwc64eb860/original/90_1017450-1A12739_1X050_18_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_0_2.jpg?sw=850&q=85&strip=true",
                            "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwaa0ecbf1/original/90_1017450-1A12739_1X050_10_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_1_2.jpg?sw=850&q=85&strip=true"
                          ],
                          snippet: "Metallic mesh sleeveless camisole top, perfect for a modern and bold look.",
                          short_description: "Metallic sleeveless camisole top.",
                          long_description: "This metallic sleeveless mesh top adds a futuristic and elegant touch to your wardrobe, ideal for evening events...",
                          image_attributes: {
                            waterproof: true,
                            color: "Silver"
                          },
                          image_classifications: {
                            type: "Top",
                            usage: "Evening"
                          },
                          variants: [
                            {
                              variantId: "var_004a",
                              color: "Silver",
                              price: 199.99
                            },
                            {
                              variantId: "var_004b",
                              color: "Gold",
                              price: 199.99
                            }
                          ]
                        },
                        explanation: "This metallic mesh sleeveless top adds a futuristic and elegant touch to your wardrobe, ideal for evening events."
                      },
                      // ... more product results
                    ]
                  }
                  // ... more items
                ]
              }
              // ... more message
            ]
          };
        }
        break;

      default:
        hardcodedResponse = undefined; // Default empty response for undefined prompts
    }

    // Reset currentChatId to ensure a new chat is created
    setCurrentChatId(null);

    // Send the prompt text as a user message, along with the hardcoded bot response
    await sendMessage(promptText, hardcodedResponse);
  };

  // Get the last bot message for loading indicators
  const lastBotMessage = conversation.map((msg) => msg.bot).filter(Boolean).pop();

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
        <ScrollArea className={`flex-1 ${conversation.length > 0 ? 'pb-20' : ''}`}>
          <div className="flex-1 p-4">
            {conversation.length === 0 ? (
              <div className="w-full max-w-2xl mx-auto px-4 text-center flex flex-col justify-center items-center min-h-screen">
                <div className="relative inline-block">
                  <Image
                    src={logo}
                    alt="Fashion Search Chat Logo"
                    width={256}
                    unoptimized
                    className="mb-6 max-w-xs md:max-w-sm"
                  />
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">Beta</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-nunito font-medium mb-2 text-gray-800 font-raleway">{getLocalizedText(userLanguage, "callMainPrompt")}</h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 font-nunito font-medium">{getLocalizedText(userLanguage, "introMainMessage")}</p>
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
                    {exampleMainPromptsKeys.map((promptKey) => (
                      <Button
                        key={promptKey}
                        variant="outline"
                        onClick={() => handleExampleClick(promptKey)}
                        className="bg-white hover:bg-gray-100 text-gray-800 transition-colors duration-200 font-nunito font-medium"
                      >
                        {getLocalizedText(userLanguage, promptKey)}
                      </Button>
                    ))}
                  </div>
                  {/* Coming soon */}
                  <div className="flex justify-center">
                    <div className="relative group w-40 h-10 mt-2">
                      <button className="bg-[#f6213f] text-white hover:bg-[#d2102c] font-medium rounded-full text-sm px-6 py-2">
                        <div className="flex items-center">
                          <Sparkles width={12} height={12} className="mr-2"/>
                          <span>{getLocalizedText(userLanguage,"comingSoonFeatures")}</span>
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
                    {/* Define conditions for readability */}
                    {!message.user && message.bot && (
                      (Array.isArray(message.bot.message) && message.bot.message.length > 0) ||
                      (typeof message.bot.message === 'string' && message.bot.message.trim()) ||
                      !message.bot.inProgress && !isLoading
                    ) && (
                      <Avatar className="mt-2 w-8 h-8">
                        <AvatarFallback>
                          <Sparkles className="w-6 h-6 text-[#f6213f]" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  
                    {/* Determine if the message bubble should be displayed */}
                    {(message.user || 
                      (message.bot && (
                        (Array.isArray(message.bot.message) && message.bot.message.length > 0) ||
                        (typeof message.bot.message === 'string' && message.bot.message.trim()) ||
                        !message.bot.inProgress
                      ))
                    ) && (
                      <div
                        className={cn(
                          "rounded-lg p-4 bg-white shadow-sm overflow-wrap break-word",
                          message.user
                            ? "bg-[#f6213f]/30 text-gray-800 max-w-[70%] font-nunito font-medium"
                            : "max-w-[80%] font-nunito font-medium"
                        )}
                      >
                        {message.user ? (
                          <div>{message.user}</div>
                        ) : message.bot && message.bot.message ? (
                          Array.isArray(message.bot.message) && message.bot.message.length > 0 ? (
                            <div className="space-y-8">
                              {message.bot.message.map((item: BotMessage, idx: number) => (
                                <div key={idx} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                  {item.searchType !== 'SPECIFIC' ? (
                                    <div className="bg-[#f6213f] px-4 py-3 border-b border-gray-200">
                                      <h2 className="text-lg font-semibold text-white flex items-center">
                                        {item.message}
                                      </h2>
                                    </div>
                                  ) : (
                                    <div className="bg-[#f6213f] px-4 py-3 border-b border-gray-200">
                                      <h2 className="text-lg font-semibold text-white flex items-center">
                                        {item.message}
                                      </h2>
                                    </div>
                                  )}
                                  <div className="p-4 space-y-6">
                                    {item.items.map((itemObj: Item, idx2: number) => (
                                      <div key={idx2}>
                                        {item.searchType !== 'SPECIFIC' && (
                                          <h1 className="text-lg text-gray-700 mb-4">
                                            • {itemObj.itemName.charAt(0).toUpperCase() + itemObj.itemName.slice(1)}
                                          </h1>
                                        )}
                                        <Carousel>
                                          {itemObj.itemResults.map((result: ItemResult, idx3: number) => (
                                            <ProductCard
                                              key={idx3}
                                              product={result.product}
                                              explanation={result.explanation}
                                              visitProductLabel={getLocalizedText(userLanguage, "visitProduct")}
                                            />
                                          ))}
                                        </Carousel>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : typeof message.bot.message === 'string' && message.bot.message.trim() ? (
                            <div className="bg-white rounded-lg font-nunito font-medium">
                              {message.bot.message}
                            </div>
                          ) : !message.bot.inProgress && !isLoading ? (
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
                    {/* Display progress message */}
                    <span className="text-gray-500 text-base md:text-lg font-medium font-nunito flex-1">
                      {(() => {
                        if (lastBotMessage && lastBotMessage.progressMessage) {
                          return lastBotMessage.progressMessage;
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