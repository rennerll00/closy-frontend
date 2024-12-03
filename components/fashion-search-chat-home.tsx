"use client";

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

const exampleHomePromptsKeys: (keyof LocalizationStrings)[] = [
  "exampleHomePrompt1",
  "exampleHomePrompt2",
  "exampleHomePrompt3",
  "exampleHomePrompt4",
  "exampleHomePrompt5",
  "exampleHomePrompt6",
  "exampleHomePrompt7",
  "exampleHomePrompt8",
  "exampleHomePrompt9",
  "exampleHomePrompt10",
  "exampleHomePrompt11",
  "exampleHomePrompt12",
  "exampleHomePrompt13",
  "exampleHomePrompt14",
  "exampleHomePrompt15",
  "exampleHomePrompt16",
  "exampleHomePrompt17",
  "exampleHomePrompt18",
];

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
    router.push('/home'); // Navigate to the root without a chatId
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
            const updatedConversation = [...conversation, ...[{ user: message }] , ...pendingConversation];
            setConversation(updatedConversation);
            setPendingConversation([]);
            setIsLoading(false);
            scrollToBottom();

            // Create chat
            const newChat = await createChat(email, updatedConversation);
            setCurrentChatId(newChat.id);
            router.replace(`home/?chat=${newChat.id}`);
            return;
          } else {
            // No pending messages
            setIsLoading(false);
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
        setConversation(prev => [...prev, botMessage ]);
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
          router.replace(`home/?chat=${newChat.id}`);
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
    if (promptKey === "exampleHomePrompt1") {
      if(userLanguage === "brazilian_portuguese") {
        hardcodedResponse = [
          {
            "score": 95,
            "product": {
              "link": "https://www.lojasrenner.com.br/p/vestido-new-midi-em-linho-com-estampa-tropical-e-alcas-finas/-/A-834045598-br.lr",
              "image": "https://img.lojasrenner.com.br/item/880249217/original/3.jpg",
              "title": "Vestido New Midi em Linho com Estampa Tropical e Alças Finas Off ...",
              "snippet": "Comprar junto. Avaliações. A Trustvox certifica que a nota média da loja Lojas Renner é. 4.7. Nota da Loja Lojas Renner. Calculamos a média com base em 433190 ...",
              "images_urls": [
                "https://img.lojasrenner.com.br/item/880249217/original/3.jpg"
              ]
            },
            "explanation": "Esse vestido possui alças finas e uma estampa tropical encantadora, ideal para quem busca um look leve e despojado, perfeito para os dias quentes. É uma ótima escolha!"
          },
          {
            "score": 90,
            "product": {
              "link": "https://www.lojasrenner.com.br/ashua/p/vestido-curto-em-cotton-com-alcas-finas/-/A-630605901-COR630605901-17-3924TCX.br.lr?sku=927501863",
              "image": "https://img.lojasrenner.com.br/item/927501871/medium/3.jpg",
              "title": "Vestido Curto em Cotton com Alças Finas Lilás - Renner",
              "snippet": "Vestido curto, confeccionado em cotton, com alças finas e decote reto. Vestido feminino Modelo curto Básico Decote reto Alças finas Sem estampa Processo ...",
              "images_urls": [
                "https://img.lojasrenner.com.br/item/927501871/medium/3.jpg"
              ]
            },
            "explanation": "O vestido possui alças finas e é curto, atendendo perfeitamente à sua procura. Seu tecido em cotton é confortável e versátil, ideal para diversas ocasiões."
          }
        ];
      } else {
        hardcodedResponse = [
          {
            "score": 90,
            "product": {
              "link": "https://www.amazon.co.uk/Lulus-Shoulder-Bodycon-Cocktail-V-Neckline/dp/B0CL98JT6L",
              "image": "https://m.media-amazon.com/images/I/61LjbjuCT3L._AC_UY1000_.jpg",
              "title": "Lulus Women's Love So Sweet Off-The-Shoulder Bodycon Cocktail ...",
              "snippet": "Lulus Women's Love So Sweet Off-The-Shoulder Bodycon Cocktail Dress with Skinny Straps and V-Neckline, Hunter Green, Hunter Green, XS : Amazon.co.uk: ...",
              "images_urls": [
                "https://m.media-amazon.com/images/I/61LjbjuCT3L._AC_UY1000_.jpg"
              ]
            },
            "explanation": "This dress perfectly fits your preference with thin shoulder straps and a chic bodycon style. It's stylish and flattering, making it a great choice for cocktail events."
          },
          {
            "score": 90,
            "product": {
              "link": "https://www.patagonia.com/product/womens-wear-with-all-wrap-dress/75220.html",
              "image": "https://www.patagonia.com/contents/patagonia.com/en_US/banners/actionworks.jpg",
              "title": "Patagonia Women's Wear With All Wrap Dress",
              "snippet": "This flattering skinny strap dress is made of 55% hemp and 45% organic cotton jersey and wraps around the waist for a flattering and customizable fit.",
              "images_urls": [
                "https://www.patagonia.com/contents/patagonia.com/en_US/banners/actionworks.jpg"
              ]
            },
            "explanation": "This dress meets your preference for thin shoulder straps and also offers a customizable fit, making it both flattering and versatile for various occasions."
          }
        ];
      }
    } else if (promptKey === "exampleHomePrompt2") {
      if(userLanguage === "brazilian_portuguese") {
        hardcodedResponse = [
          {
            "score": 100,
            "product": {
              "link": "https://www.netshoes.com.br/shorts/adidas/rosa",
              "image": "https://static.netshoes.com.br/bnn/l_netshoes/2024-10-07/9740_netshoes-share.png",
              "title": "Shorts Adidas Rosa | Netshoes",
              "snippet": "Receba rápido este produto saindo direto do Centro de Distribuição da Netshoes. Short Adidas Pacer Knit Feminino. R$ 149,99. ou 3x de R$ 50,00. LANÇAMENTO.",
              "images_urls": [
                "https://static.netshoes.com.br/bnn/l_netshoes/2024-10-07/9740_netshoes-share.png"
              ]
            },
            "explanation": "Recomendo! O Short Adidas Pacer Knit Feminino na cor rosa é ideal para corrida, combinando estilo e conforto, perfeito para mulheres ativas."
          },
          {
            "score": 80,
            "product": {
              "link": "https://www.yellowtreestore.com.br/shorts-fitness-feminino-yellow-tree-rosa/p/a106",
              "image": "https://static.yellowtreestore.com.br/public/yellowtreestore/imagens/produtos/shorts-fitness-feminino-yellow-tree-rosa-65e0b2c58e1d9.jpg",
              "title": "SHORTS FITNESS FEMININO YELLOW TREE ROSA - Yellow Tree",
              "snippet": "Shorts Fitness A Yellow Tree é uma marca de moda contemporânea, oferecendo uma seleção única de roupas que combinam estilo e conforto.",
              "images_urls": [
                "https://static.yellowtreestore.com.br/public/yellowtreestore/imagens/produtos/shorts-fitness-feminino-yellow-tree-rosa-65e0b2c58e1d9.jpg"
              ]
            },
            "explanation": "Esse short é uma boa escolha para corrida, mas a cor é rosa claro, o que se alinha parcialmente com sua preferência por \"rosa\". O conforto e o estilo também são bons para atividades físicas."
          }
        ];
      } else {
        // Hardcoded responses for other languages (e.g., English)
        hardcodedResponse = [
          {
            "score": 95,
            "product": {
              "link": "https://www.nike.com/t/tempo-womens-running-shorts-0DGW8C",
              "image": "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/a3a5022c-0c42-4041-85f1-dfda4bde5395/tempo-womens-running-shorts-0DGW8C.png",
              "title": "Nike Tempo Women's Running Shorts",
              "snippet": "The Nike Tempo Shorts deliver a classic fit with sweat-wicking technology and a trimmed-up design that moves with you.",
              "images_urls": [
                "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/a3a5022c-0c42-4041-85f1-dfda4bde5395/tempo-womens-running-shorts-0DGW8C.png"
              ]
            },
            "explanation": "These pink running shorts from Nike are lightweight and perfect for your runs. They offer comfort and style, matching your preference."
          },
          {
            "score": 90,
            "product": {
              "link": "https://www.adidas.com/us/pink-shorts",
              "image": "https://assets.adidas.com/images/w_600,f_auto,q_auto/6f97c33a8f98447493f2ab7900e6a0ad_9366/Primeblue_Designed_2_Move_Shorts_Pink_GK0358_21_model.jpg",
              "title": "adidas Primeblue Shorts - Pink",
              "snippet": "Stay comfortable during your workouts with these pink adidas shorts, featuring breathable fabric and a stylish design.",
              "images_urls": [
                "https://assets.adidas.com/images/w_600,f_auto,q_auto/6f97c33a8f98447493f2ab7900e6a0ad_9366/Primeblue_Designed_2_Move_Shorts_Pink_GK0358_21_model.jpg"
              ]
            },
            "explanation": "These adidas shorts are great for running, and their pink color matches your preference. They're both functional and fashionable."
          }
        ];
      }
    } else if (promptKey === "exampleHomePrompt3") {
      if(userLanguage === "brazilian_portuguese") {
        hardcodedResponse = [
          {
            "score": 95,
            "product": {
              "link": "https://www.lojasrenner.com.br/p/camisa-social-masculina-azul/-/A-5705019-594",
              "image": "https://img.lojasrenner.com.br/item/571060971/large/1.jpg",
              "title": "Camisa Social Masculina Azul - Renner",
              "snippet": "Camisa social masculina azul com corte slim fit, ideal para eventos formais.",
              "images_urls": [
                "https://img.lojasrenner.com.br/item/571060971/large/1.jpg"
              ]
            },
            "explanation": "Esta camisa social azul é perfeita para um casamento, oferecendo elegância e conforto."
          },
          {
            "score": 90,
            "product": {
              "link": "https://www.zara.com/br/pt/camisa-azul-masculina-p02548254.html",
              "image": "https://static.zara.net/photos//2023/V/0/2/p/2548/254/405/2/w/750/2548254405_1_1_1.jpg?ts=1615475474215",
              "title": "Camisa Azul Masculina - Zara",
              "snippet": "Camisa azul masculina com tecido leve, perfeita para ocasiões especiais.",
              "images_urls": [
                "https://static.zara.net/photos//2023/V/0/2/p/2548/254/405/2/w/750/2548254405_1_1_1.jpg?ts=1615475474215"
              ]
            },
            "explanation": "Outra excelente opção de camisa azul para usar no casamento."
          }
        ];
      } else {
        // Hardcoded responses for other languages (e.g., English)
        hardcodedResponse = [
          {
            "score": 95,
            "product": {
              "link": "https://www.macys.com/shop/product/mens-dress-shirt-blue?ID=12345",
              "image": "https://slimages.macysassets.com/is/image/MCY/products/8/optimized/1374568_fpx.tif",
              "title": "Men's Blue Dress Shirt - Macy's",
              "snippet": "A classic blue dress shirt suitable for formal events like weddings.",
              "images_urls": [
                "https://slimages.macysassets.com/is/image/MCY/products/8/optimized/1374568_fpx.tif"
              ]
            },
            "explanation": "This blue dress shirt is perfect for your friend's wedding, offering a stylish and formal look."
          },
          {
            "score": 90,
            "product": {
              "link": "https://www.hugoboss.com/us/mens-blue-shirt/hbna50260011_100.html",
              "image": "https://images.hugoboss.com/is/image/boss/hbna50260011_100_100?fit=crop,1&wid=950&hei=950",
              "title": "Men's Blue Shirt - HUGO BOSS",
              "snippet": "Elegant blue shirt crafted from premium cotton, ideal for special occasions.",
              "images_urls": [
                "https://images.hugoboss.com/is/image/boss/hbna50260011_100_100?fit=crop,1&wid=950&hei=950"
              ]
            },
            "explanation": "An excellent choice for a wedding, this blue shirt combines comfort with sophistication."
          }
        ];
      }
    }

    // Reset currentChatId to ensure a new chat is created
    setCurrentChatId(null);

    // Send the prompt text as a user message, along with the hardcoded bot response
    await sendMessage(promptText, hardcodedResponse);
  };

  const lastBotMessage = conversation.map((msg) => msg.bot).filter(Boolean).pop();

  // Prepare the prompts for the scrolling brick layout
  const prompts = exampleHomePromptsKeys.map((promptKey) => ({
    key: promptKey,
    text: getLocalizedText(userLanguage, promptKey),
  }));

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
                onClick={() => router.push(`home/?chat=${conv.id}`)}
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
                <h1 className="text-2xl md:text-4xl font-nunito font-medium mb-2 text-gray-800 font-raleway">{getLocalizedText(userLanguage, "callHomePrompt")}</h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 font-nunito font-medium">{getLocalizedText(userLanguage, "introHomeMessage")}</p>
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
                  {/* Infinite Scrolling Brick Layout */}
                  <div className="relative max-w-[200px] md:max-w-[400px] mx-auto scroll-container">
                    <div className="infinite-scroll">
                      {/* First set of prompts */}
                      <div className="flex space-x-4 p-4">
                        {Array.from({ length: Math.ceil(prompts.length / 3) }).map((_, columnIndex) => (
                          <div key={columnIndex} className="flex flex-col space-y-4">
                            {prompts.slice(columnIndex * 3, columnIndex * 3 + 3).map((prompt, index) => (
                              <div
                                key={index}
                                onClick={() => handleExampleClick(prompt.key)}
                                className="flex items-center rounded-lg bg-white hover:bg-gray-100 text-gray-800 px-2 py-1 text-xs transition-colors cursor-pointer font-nunito font-medium whitespace-normal max-w-[10rem] md:max-w-xs"
                              >
                                {prompt.text}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Duplicate set of prompts for seamless scrolling */}
                      <div className="flex space-x-4 p-4">
                        {Array.from({ length: Math.ceil(prompts.length / 3) }).map((_, columnIndex) => (
                          <div key={`duplicate-${columnIndex}`} className="flex flex-col space-y-4">
                            {prompts.slice(columnIndex * 3, columnIndex * 3 + 3).map((prompt, index) => (
                              <div
                                key={index}
                                onClick={() => handleExampleClick(prompt.key)}
                                className="flex items-center rounded-lg bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 text-sm transition-colors cursor-pointer font-nunito font-medium whitespace-normal max-w-xs"
                              >
                                {prompt.text}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <ScrollBar orientation="horizontal" className="bg-gray-300" />
                  </div>
                  {/* Coming soon features remain unchanged */}
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
