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
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  checkChat,
  createChat,
  getChats,
  removeUser,
  signupUser,
} from '../lib/api';
import { getLocalizedText, getUserLanguage, LocalizationStrings } from '../lib/localization';

import logo from '/public/images/logo.png';

interface Product {
  title: string;
  link: string;
  snippet: string;
  image: string;
  images_urls: string[];
}

interface BotMessage {
  product?: Product;
  score?: number;
  explanation?: string;
  message?: BotResponse;
  "in-progress"?: boolean;
  "progress-message"?: string;
}

type BotResponse = string | BotMessage[];

interface ConversationMessage {
  user?: string;
  bot?: BotMessage;
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

const exampleMainPromptsKeys: (keyof LocalizationStrings)[] = ["exampleMainPrompt1","exampleMainPrompt2","exampleMainPrompt3","exampleMainPrompt4"];

export function FashionSearchChat() {
  const router = useRouter();

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
  const [isAwaitingEmail, setIsAwaitingEmail] = useState(false);
  const [pendingConversation, setPendingConversation] = useState<ConversationMessage[]>([]);

  const [chatIdFromUrl, setChatIdFromUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const chatId = params.get('chat');
      setChatIdFromUrl(chatId);
    }
  }, []);

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
    if (chatIdFromUrl) {
      setCurrentChatId(chatIdFromUrl);
      loadConversationById(chatIdFromUrl);
    }
  }, [chatIdFromUrl, conversations, loadConversationById]);

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
    router.push('/main'); // Navigate to the root without a chatId
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const ProductCard = ({ product, explanation }: BotMessage) => {
    if (!product) return null;
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
          {product.images_urls?.length > 0 && (
            <div className="overflow-x-auto w-full whitespace-nowrap rounded-lg h-24">
              <div className="flex gap-2 p-2">
                {Array.from(new Set(product.images_urls)).map((url, idx) => (
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
   * @param botResponse Optional hardcoded bot response for example prompts.
   */
  const sendMessage = async (message: string, botResponse?: BotResponse) => {
    if (!message.trim()) return;

    setInput('');
    setIsLoading(true);

    if (isAwaitingEmail) {
      // We are awaiting email
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
            setIsLoading(false);
            scrollToBottom();
    
            // Create chat
            const newChat = await createChat(email, updatedConversation);
            setCurrentChatId(newChat.id);
            router.replace(`main/?chat=${newChat.id}`);
            return;
          } else {
            // No pending messages
            // Add user's email message to conversation
            const betaBotMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "emailBetaPrompt"), "in-progress": false } };
            const updatedConversation = [...conversation, { user: message }, betaBotMessage];
            setConversation(updatedConversation);
            setIsLoading(false);
            scrollToBottom();
    
            // Create chat
            try {
              const newChat = await createChat(email, updatedConversation);
              setCurrentChatId(newChat.id);
              router.replace(`main/?chat=${newChat.id}`);
            } catch (error) {
              console.error('Error creating chat:', error);
              const errorBotMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "createChatError"), "in-progress": false } };
              setConversation(prev => [...prev, errorBotMessage]);
              setIsLoading(false);
            }
            return;
          }
        } catch (error) {
          console.error('Error during signup or creating chat:', error);
          const botMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "createChatError"), "in-progress": false } };
          setConversation(prev => [...prev, botMessage]);
          setIsLoading(false);
        }
      } else {
        // Invalid email
        const botMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "invalidEmail"), "in-progress": false } };
        setConversation(prev => [...prev, botMessage]);
        setIsLoading(false);
      }
      return;
    }

    if (botResponse) {
      // This is an example prompt with a hardcoded bot response
      const userMessage: ConversationMessage = { user: message };
      const botMessage: ConversationMessage = { bot: { message: botResponse, "in-progress": false } };

      if (!userData.email) {
        // Ask for email
        const emailPrompt: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "askEmail"), "in-progress": false } };
        setConversation(prev => [...prev, userMessage, emailPrompt]);
        setIsAwaitingEmail(true);
        // Store pending conversation
        setPendingConversation([botMessage]);
        setIsLoading(false);
        return;
      } else {
        // Email is set, proceed to add messages and create chat
        const updatedConversation = [...conversation, userMessage, botMessage];
        setConversation(updatedConversation);
        setIsLoading(false);
        scrollToBottom();

        // Create chat
        try {
          const newChat = await createChat(userData.email, updatedConversation);
          setCurrentChatId(newChat.id);
          router.replace(`main/?chat=${newChat.id}`);
        } catch (error) {
          console.error('Error creating chat after example prompt:', error);
          const errorBotMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "createChatError"), "in-progress": false } };
          setConversation(prev => [...prev, errorBotMessage]);
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
      const botMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "askEmail"), "in-progress": false } };
      setConversation(prev => [...prev, botMessage ]);
      setIsAwaitingEmail(true);
      setPendingConversation([]);
      setIsLoading(false);
      return;
    }

    // Check if enough preferences
    const result = await checkChat(currentConversation, userLanguage);
    console.log("result.response", result.response);

    if (result.response === 'OK') {
      if (currentChatId) {
        // Update chat
        setIsLoading(true);
        setTimeout(() => {
          const betaBotMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "emailBetaPrompt"), "in-progress": false } };
          setConversation(prev => [...prev, betaBotMessage]);
          setIsLoading(false);
        }, 3000);
      } else {
        // Instead of proceeding to create chat, simulate loading/thinking and show beta message
        setIsLoading(true);
        setTimeout(() => {
          const betaBotMessage: ConversationMessage = { bot: { message: getLocalizedText(userLanguage, "emailBetaPrompt"), "in-progress": false } };
          setConversation(prev => [...prev, betaBotMessage]);
          setIsLoading(false);
        }, 3000);
      }
    } else {
      // Display result.response message on the chat
      const botMessage: ConversationMessage = { bot: { message: result.response, "in-progress": false } };
      setConversation(prev => [...prev, botMessage ]);
      setIsLoading(false);
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
    let hardcodedResponse: BotResponse = [];

    // Define hardcoded responses based on promptKey and userLanguage
    switch (promptKey) {
      case "exampleMainPrompt1": // Pink Floral Print Short Dress with Sleeves
        if (userLanguage === "brazilian_portuguese") {
          hardcodedResponse = [
            {
              "score": 95,
              "product": {
                "link": "https://www.zimmermann.com/us/tops-tank-cami/mini-dresses/lightburst-cut-out-mini-dress-red-floral.html",
                "image": "https://www.zimmermann.com/media/catalog/product/1/_/1.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                "title": "Vestido Mini Floral Lightburst com Recortes - Zimmermann",
                "snippet": "Este vestido mini de floral com recortes elegantes é perfeito para ocasiões especiais, oferecendo um toque de sofisticação e estilo.",
                "images_urls": [
                  "https://www.zimmermann.com/media/catalog/product/1/_/1.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                  "https://www.zimmermann.com/media/catalog/product/3/_/3.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755"
                ]
              },
              "explanation": "Este vestido mini floral combina elegância e modernidade com seus recortes estratégicos, ideal para festas e eventos noturnos."
            },
            {
              "score": 90,
              "product": {
                "link": "https://www.zimmermann.com/us/tops-tank-cami/mini-dresses/waverly-wrap-mini-dress-cream-pink-bird.html",
                "image": "https://www.zimmermann.com/media/catalog/product/1/_/1.1469dss243.cpb.cream-pink-bird.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                "title": "Vestido Mini Envolvente Waverly em Creme com Pássaros Cor-de-Rosa - Zimmermann",
                "snippet": "O vestido Waverly Wrap apresenta uma estampa delicada de pássaros cor-de-rosa sobre um fundo creme, oferecendo um visual romântico e feminino.",
                "images_urls": [
                  "https://www.zimmermann.com/media/catalog/product/1/_/1.1469dss243.cpb.cream-pink-bird.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                  "https://www.zimmermann.com/media/catalog/product/3/_/3.1469dss243.cpb.cream-pink-bird.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755"
                ]
              },
              "explanation": "Com sua estampa encantadora e design envolvente, este vestido é perfeito para um look diurno sofisticado e confortável."
            }
          ];
        } else {
          // Hardcoded responses for other languages (e.g., English)
          hardcodedResponse = [
            {
              "score": 95,
              "product": {
                "link": "https://www.zimmermann.com/us/tops-tank-cami/mini-dresses/lightburst-cut-out-mini-dress-red-floral.html",
                "image": "https://www.zimmermann.com/media/catalog/product/1/_/1.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                "title": "Lightburst Cut-Out Mini Dress Red Floral - Zimmermann",
                "snippet": "This red floral mini dress with elegant cut-outs is perfect for special occasions, offering a touch of sophistication and style.",
                "images_urls": [
                  "https://www.zimmermann.com/media/catalog/product/1/_/1.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                  "https://www.zimmermann.com/media/catalog/product/3/_/3.1899dss246.refl.red-floral.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755"
                ]
              },
              "explanation": "This floral mini dress combines elegance and modernity with its strategic cut-outs, ideal for evening parties and events."
            },
            {
              "score": 90,
              "product": {
                "link": "https://www.zimmermann.com/us/tops-tank-cami/mini-dresses/waverly-wrap-mini-dress-cream-pink-bird.html",
                "image": "https://www.zimmermann.com/media/catalog/product/1/_/1.1469dss243.cpb.cream-pink-bird.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                "title": "Waverly Wrap Mini Dress Cream Pink Bird - Zimmermann",
                "snippet": "The Waverly Wrap Dress features a delicate pink bird print on a cream background, offering a romantic and feminine look.",
                "images_urls": [
                  "https://www.zimmermann.com/media/catalog/product/1/_/1.1469dss243.cpb.cream-pink-bird.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755",
                  "https://www.zimmermann.com/media/catalog/product/3/_/3.1469dss243.cpb.cream-pink-bird.jpg?quality=100&bg-color=255,255,255&fit=bounds&height=755&width=581&canvas=581:755"
                ]
              },
              "explanation": "With its charming print and wrap design, this dress is perfect for a sophisticated daytime look that is both stylish and comfortable."
            }
          ];
        }
        break;

      case "exampleMainPrompt2": // Military Green Cargo Pants with Side Pockets
        if (userLanguage === "brazilian_portuguese") {
          hardcodedResponse = [
            {
              "score": 95,
              "product": {
                "link": "https://www.celine.com/en-us/celine-shop-women/ready-to-wear/pants-and-shorts/cargo-pants-in-cotton-linen-2Z552219I.02MK.html",
                "image": "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_1_SS24_W.jpg?twic=v1/cover=1:1/resize-max=900",
                "title": "Calças Cargo em Algodão e Linho - Celine",
                "snippet": "Calças cargo elegantes em algodão e linho, com bolsos laterais profundos para um estilo utilitário sofisticado.",
                "images_urls": [
                  "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_1_SS24_W.jpg?twic=v1/cover=1:1/resize-max=900",
                  "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_3_SS24_W.jpg?twic=v1/cover=820x820/max=2000"
                ]
              },
              "explanation": "Estas calças cargo combinam funcionalidade com estilo, perfeitas para um visual urbano e moderno."
            },
            {
              "score": 90,
              "product": {
                "link": "https://citizensofhumanity.com/products/marcelle-low-slung-easy-cargo-corduroy-costes",
                "image": "https://citizensofhumanity.com/cdn/shop/files/2078-041_MARCELLE_CARGO_CORDUROY_COSTES_1274_d5113432-987c-4647-8695-efad45aba9f6.jpg?v=1720644296",
                "title": "Calças Cargo de Corduroy Marcelle - Citizens of Humanity",
                "snippet": "Calças cargo de corduroy de corte baixo, oferecendo conforto e estilo casual com bolsos utilitários.",
                "images_urls": [
                  "https://citizensofhumanity.com/cdn/shop/files/2078-041_MARCELLE_CARGO_CORDUROY_COSTES_1274_d5113432-987c-4647-8695-efad45aba9f6.jpg?v=1720644296",
                  "https://citizensofhumanity.com/cdn/shop/files/2078-041_MARCELLE_CARGO_CORDUROY_COSTES_1286_b195736c-99b0-44e4-a3a4-fa7b8f1213ba.jpg?v=1720644296"
                ]
              },
              "explanation": "Estas calças cargo de corduroy adicionam textura e profundidade ao seu guarda-roupa casual, mantendo a praticidade dos bolsos laterais."
            }
          ];
        } else {
          // Hardcoded responses for other languages (e.g., English)
          hardcodedResponse = [
            {
              "score": 95,
              "product": {
                "link": "https://www.celine.com/en-us/celine-shop-women/ready-to-wear/pants-and-shorts/cargo-pants-in-cotton-linen-2Z552219I.02MK.html",
                "image": "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_1_SS24_W.jpg?twic=v1/cover=1:1/resize-max=900",
                "title": "Cotton Linen Cargo Pants - Celine",
                "snippet": "Elegant cargo pants made from cotton and linen, featuring deep side pockets for a sophisticated utilitarian style.",
                "images_urls": [
                  "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_1_SS24_W.jpg?twic=v1/cover=1:1/resize-max=900",
                  "https://twicpics.celine.com/product-prd/images/large/2Z552219I.02MK_3_SS24_W.jpg?twic=v1/cover=820x820/max=2000"
                ]
              },
              "explanation": "These cargo pants blend functionality with style, perfect for an urban and modern look."
            },
            {
              "score": 90,
              "product": {
                "link": "https://citizensofhumanity.com/products/marcelle-low-slung-easy-cargo-corduroy-costes",
                "image": "https://citizensofhumanity.com/cdn/shop/files/2078-041_MARCELLE_CARGO_CORDUROY_COSTES_1274_d5113432-987c-4647-8695-efad45aba9f6.jpg?v=1720644296",
                "title": "Marcelle Low-Slung Easy Cargo Corduroy Pants - Citizens of Humanity",
                "snippet": "Low-slung cargo corduroy pants offering comfort and casual style with utilitarian pockets.",
                "images_urls": [
                  "https://citizensofhumanity.com/cdn/shop/files/2078-041_MARCELLE_CARGO_CORDUROY_COSTES_1274_d5113432-987c-4647-8695-efad45aba9f6.jpg?v=1720644296",
                  "https://citizensofhumanity.com/cdn/shop/files/2078-041_MARCELLE_CARGO_CORDUROY_COSTES_1286_b195736c-99b0-44e4-a3a4-fa7b8f1213ba.jpg?v=1720644296"
                ]
              },
              "explanation": "These corduroy cargo pants add texture and depth to your casual wardrobe while maintaining the practicality of side pockets."
            }
          ];
        }
        break;

      case "exampleMainPrompt3": // Black Tweed Blazer with Golden Buttons
        if (userLanguage === "brazilian_portuguese") {
          hardcodedResponse = [
            {
              "score": 95,
              "product": {
                "link": "https://us.balmain.com/en/p/buttons-tweed-jacket-DF1SK249KG430PA.html",
                "image": "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAF?_i=AG",
                "title": "Blazer Tweed com Botões Dourados - Balmain",
                "snippet": "Blazer de tweed preto com botões dourados, combinando tradição com um toque de luxo moderno.",
                "images_urls": [
                  "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAF?_i=AG",
                  "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAA?_i=AG"
                ]
              },
              "explanation": "Este blazer tweed preto é perfeito para adicionar um toque sofisticado e elegante ao seu guarda-roupa formal."
            },
            {
              "score": 90,
              "product": {
                "link": "https://us.sandro-paris.com/en/p/long-tweed-jacket/SFPVE01049_44.html",
                "image": "https://us.sandro-paris.com/dw/image/v2/BCMW_PRD/on/demandware.static/-/Sites-master-catalog/default/dwa843429c/images/hi-res/Sandro_SFPVE01049-44_F_1.jpg?sw=2000&sh=2000",
                "title": "Jaqueta Longa de Tweed - Sandro Paris",
                "snippet": "Jaqueta longa de tweed preto com botões dourados, oferecendo um visual elegante e atemporal.",
                "images_urls": [
                  "https://us.sandro-paris.com/dw/image/v2/BCMW_PRD/on/demandware.static/-/Sites-master-catalog/default/dwa843429c/images/hi-res/Sandro_SFPVE01049-44_F_1.jpg?sw=2000&sh=2000",
                  "https://us.sandro-paris.com/dw/image/v2/BCMW_PRD/on/demandware.static/-/Sites-master-catalog/default/dw41d97900/images/hi-res/Sandro_SFPVE01049-44_F_3.jpg?sw=2000&sh=2000",
                ]
              },
              "explanation": "Com seu corte longo e detalhes em botões dourados, esta jaqueta de tweed é ideal para um estilo clássico e refinado."
            }
          ];
        } else {
          // Hardcoded responses for other languages (e.g., English)
          hardcodedResponse = [
            {
              "score": 95,
              "product": {
                "link": "https://us.balmain.com/en/p/buttons-tweed-jacket-DF1SK249KG430PA.html",
                "image": "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAF?_i=AG",
                "title": "Black Tweed Blazer with Golden Buttons - Balmain",
                "snippet": "Black tweed blazer with golden buttons, blending tradition with a touch of modern luxury.",
                "images_urls": [
                  "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAF?_i=AG",
                  "https://media.balmain.com/image/upload/f_auto,q_auto,dpr_auto/w_3000/sfcc/balmain/hi-res/DF1SK249KG430PAA?_i=AG"
                ]
              },
              "explanation": "This black tweed blazer is perfect for adding a sophisticated and elegant touch to your formal wardrobe."
            },
            {
              "score": 90,
              "product": {
                "link": "https://us.sandro-paris.com/en/p/long-tweed-jacket/SFPVE01049_44.html",
                "image": "https://us.sandro-paris.com/dw/image/v2/BCMW_PRD/on/demandware.static/-/Sites-master-catalog/default/dwa843429c/images/hi-res/Sandro_SFPVE01049-44_F_1.jpg?sw=2000&sh=2000",
                "title": "Long Tweed Jacket - Sandro Paris",
                "snippet": "Long black tweed jacket with golden buttons, offering a timeless and elegant look.",
                "images_urls": [
                  "https://us.sandro-paris.com/dw/image/v2/BCMW_PRD/on/demandware.static/-/Sites-master-catalog/default/dwa843429c/images/hi-res/Sandro_SFPVE01049-44_F_1.jpg?sw=2000&sh=2000",
                  "https://us.sandro-paris.com/dw/image/v2/BCMW_PRD/on/demandware.static/-/Sites-master-catalog/default/dw41d97900/images/hi-res/Sandro_SFPVE01049-44_F_3.jpg?sw=2000&sh=2000",
                ]
              },
              "explanation": "With its long cut and golden button details, this tweed jacket is ideal for a classic and refined style."
            }
          ];
        }
        break;

      case "exampleMainPrompt4": // Metallic Mesh Sleeveless Top
        if (userLanguage === "brazilian_portuguese") {
          hardcodedResponse = [
            {
              "score": 95,
              "product": {
                "link": "https://www.versace.com/us/en/women/clothing/shirts-tops/metal-mesh-camisole-top/1017450-1A12739_1X050.html",
                "image": "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwc64eb860/original/90_1017450-1A12739_1X050_18_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_0_2.jpg?sw=850&q=85&strip=true",
                "title": "Top Camisola de Malha Metálica - Versace",
                "snippet": "Top camisola sem mangas de malha metálica, perfeito para um visual moderno e ousado.",
                "images_urls": [
                  "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwc64eb860/original/90_1017450-1A12739_1X050_18_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_0_2.jpg?sw=850&q=85&strip=true",
                  "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwaa0ecbf1/original/90_1017450-1A12739_1X050_10_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_1_2.jpg?sw=850&q=85&strip=true"
                ]
              },
              "explanation": "Este top sem mangas de malha metálica adiciona um toque futurista e elegante ao seu guarda-roupa, ideal para eventos noturnos."
            },
            {
              "score": 90,
              "product": {
                "link": "https://fashion.rabanne.com/en-us/products/top-in-a-silver-mini-mesh-19eito023mh0062-p040",
                "image": "https://fashion.rabanne.com/cdn/shop/files/LOOK_31_4929.jpg?v=1713432520&width=800",
                "title": "Top Mini de Malha Prateada - Rabanne",
                "snippet": "Top mini sem mangas de malha prateada, oferecendo um visual sofisticado e brilhante.",
                "images_urls": [
                  "https://fashion.rabanne.com/cdn/shop/files/LOOK_31_4929.jpg?v=1713432520&width=800"
                ]
              },
              "explanation": "Com seu acabamento metálico e design sem mangas, este top é perfeito para adicionar brilho e elegância ao seu look."
            }
          ];
        } else {
          // Hardcoded responses for other languages (e.g., English)
          hardcodedResponse = [
            {
              "score": 95,
              "product": {
                "link": "https://www.versace.com/us/en/women/clothing/shirts-tops/metal-mesh-camisole-top/1017450-1A12739_1X050.html",
                "image": "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwc64eb860/original/90_1017450-1A12739_1X050_18_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_0_2.jpg?sw=850&q=85&strip=true",
                "title": "Metal Mesh Sleeveless Camisole Top - Versace",
                "snippet": "Metallic mesh sleeveless camisole top, perfect for a modern and bold look.",
                "images_urls": [
                  "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwc64eb860/original/90_1017450-1A12739_1X050_18_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_0_2.jpg?sw=850&q=85&strip=true",
                  "https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dwaa0ecbf1/original/90_1017450-1A12739_1X050_10_MetalMeshCamisoleTop-Shirts~~Tops-Versace-online-store_1_2.jpg?sw=850&q=85&strip=true"
                ]
              },
              "explanation": "This metallic mesh sleeveless top adds a futuristic and elegant touch to your wardrobe, ideal for evening events."
            },
            {
              "score": 90,
              "product": {
                "link": "https://fashion.rabanne.com/en-us/products/top-in-a-silver-mini-mesh-19eito023mh0062-p040",
                "image": "https://fashion.rabanne.com/cdn/shop/files/LOOK_31_4929.jpg?v=1713432520&width=800",
                "title": "Silver Mini Mesh Top - Rabanne",
                "snippet": "Silver mini sleeveless mesh top, offering a sophisticated and shiny look.",
                "images_urls": [
                  "https://fashion.rabanne.com/cdn/shop/files/LOOK_31_4929.jpg?v=1713432520&width=800"
                ]
              },
              "explanation": "With its metallic finish and sleeveless design, this top is perfect for adding shine and elegance to your outfit."
            }
          ];
        }
        break;

      default:
        hardcodedResponse = []; // Default empty response for undefined prompts
    }

    // Reset currentChatId to ensure a new chat is created
    setCurrentChatId(null);

    // Send the prompt text as a user message, along with the hardcoded bot response
    await sendMessage(promptText, hardcodedResponse);
  };

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
                onClick={() => router.push(`main/?chat=${conv.id}`)}
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
                    {!message.user && (message.bot && (((message.bot.message && Array.isArray(message.bot.message) && message.bot.message.length > 0) || typeof message.bot.message == "string") || !message.bot["in-progress"])) && (
                      <Avatar className="mt-2 w-8 h-8">
                        <AvatarFallback>
                          <Sparkles className="w-6 h-6 text-[#f6213f]" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {(message.user || (message.bot && (((message.bot.message && Array.isArray(message.bot.message) && message.bot.message.length > 0) || typeof message.bot.message == "string") || !message.bot["in-progress"]))) && <div className={cn(
                      "rounded-lg p-4 bg-white shadow-sm overflow-wrap break-word",
                      message.user ? "bg-[#f6213f]/30 text-gray-800 max-w-[70%] font-nunito font-medium" : "max-w-[80%] font-nunito font-medium"
                    )}>
                      {message.user ? (
                        <div>{message.user}</div>
                      ) : message.bot ? (
                        message.bot.message ? (
                          Array.isArray(message.bot.message) ? (
                            message.bot.message.length > 0 ? (
                              <div className="space-y-4">
                                {message.bot.message.map((item: BotMessage, idx: number) => (
                                  <ProductCard key={idx} product={item.product} explanation={item.explanation} />
                                ))}
                              </div>
                            ) : (
                              !message.bot["in-progress"] ? (
                                <div className="bg-white rounded-lg font-nunito font-medium">
                                  {getLocalizedText(userLanguage, "noResults")}
                                </div>
                              ) : null
                            )
                          ) : (
                            <div className="bg-white rounded-lg font-nunito font-medium">
                              {message.bot.message}
                            </div>
                          )
                        ) : null
                      ) : null}
                    </div>}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-4 justify-start p-4">
                    <div className="relative w-12 h-12 md:w-12 md:h-12 flex-shrink-0">
                      <div className="absolute inset-0 border-4 border-[#f6213f] rounded-full animate-ping" />
                      <div className="absolute inset-2 border-4 border-[#f6213f] rounded-full animate-spin" />
                      <Sparkles className="absolute inset-3 w-5 h-5 md:w-6 md:h-6 text-[#f6213f] m-auto" />
                    </div>
                    {/* Display progress message */}
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
