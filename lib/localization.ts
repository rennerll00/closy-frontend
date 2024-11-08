// localization.ts
// Define the localization type to ensure consistency across languages
export type LocalizationStrings = {
  appName: string;
  newChat: string;
  free: string;
  country: string;
  selectCountry: string;
  logout: string;
  guest: string;
  tier: string;
  callPrompt: string;
  introMessage: string;
  describeItem: string;
  sendMessage: string;
  examplePrompt1: string;
  examplePrompt2: string;
  examplePrompt3: string;
  unitedstates: string;
  brazil: string;
  noResults: string;
  viewProduct: string;
  relevanceLabel: string;
  errorPreferencesQueries: string;
  findingMostRelevantMatches: string;
  loadingPreviousChat: string;
  thinking: string;
  // New keys for coming soon features section
  comingSoonFeatures: string;
  virtualFitPreviewTitle: string;
  virtualFitPreviewSubtitle: string;
  personalizedStyleFeedTitle: string;
  personalizedStyleFeedSubtitle: string;
  smartFashionAssistantTitle: string;
  smartFashionAssistantSubtitle: string;
  seamlessCheckoutTrackingTitle: string;
  seamlessCheckoutTrackingSubtitle: string;
  exclusiveDealsStockAlertsTitle: string;
  exclusiveDealsStockAlertsSubtitle: string;
  enterEmailPlaceholder: string;
  stayInformedCTA: string;
};

export const localizations: Record<"english" | "brazilian_portuguese", LocalizationStrings> = {
  english: {
    appName: "Closy AI",
    newChat: "New Chat",
    free: "Free",
    country: "Country",
    selectCountry: "Select country",
    logout: "Logout",
    guest: "Guest",
    tier: "Free",
    callPrompt: "Find the look you always looked for",
    introMessage: "What specific fashion piece you want to find?",
    describeItem: "Describe the item in details...",
    sendMessage: "Type more...",
    examplePrompt1: "Find dress with thin shoulder straps",
    examplePrompt2: "Moletom pants with lateral zipper pockets",
    examplePrompt3: "I need a short jeans skirt with buttons",
    unitedstates: "United States",
    brazil: "Brazil",
    noResults: "No results :/",
    viewProduct: "View Product",
    relevanceLabel: "relevant",
    errorPreferencesQueries: "Sorry, I couldn't understand your preferences. Could you describe again what you're looking for?",
    findingMostRelevantMatches: "Finding most relevant matches",
    loadingPreviousChat: "Loading previous chat...",
    thinking: "Thinking...",
    // New feature section
    comingSoonFeatures: "Coming Soon",
    virtualFitPreviewTitle: "Virtual Try-On",
    virtualFitPreviewSubtitle: "Visualize how clothes fit you before purchasing.",
    personalizedStyleFeedTitle: "Style Feed",
    personalizedStyleFeedSubtitle: "Discover outfit tailored suggestions and the latest trends.",
    smartFashionAssistantTitle: "Smart Fashion Assistant",
    smartFashionAssistantSubtitle: "Chat with a style expert that remembers and evolves with your style.",
    seamlessCheckoutTrackingTitle: "Seamless Checkout & Tracking",
    seamlessCheckoutTrackingSubtitle: "Complete purchases and monitor orders in one single place.",
    exclusiveDealsStockAlertsTitle: "Exclusive Deals & Alerts",
    exclusiveDealsStockAlertsSubtitle: "Get the best prices and be notified about your favorite collections",
    enterEmailPlaceholder: "Enter your email...",
    stayInformedCTA: "Stay Informed",
  },
  brazilian_portuguese: {
    appName: "Closy AI",
    newChat: "Novo Chat",
    free: "Grátis",
    country: "País",
    selectCountry: "Selecione o país",
    logout: "Sair",
    guest: "Convidado",
    tier: "Grátis",
    callPrompt: "Encontre o look que sempre procurou",
    introMessage: "Qual peça específica de moda você quer encontrar?",
    describeItem: "Descreva em detalhes o item...",
    sendMessage: "Escreva mais...",
    examplePrompt1: "Estou procurando vestido de alças finas",
    examplePrompt2: "Calça moletom com bolsos laterais de zíper",
    examplePrompt3: "Preciso de saia jeans curta com botões",
    unitedstates: "Estados Unidos",
    brazil: "Brasil",
    noResults: "Sem resultados :/",
    viewProduct: "Ver produto",
    relevanceLabel: "relevante",
    errorPreferencesQueries: "Desculpe, não consegui entender suas preferências. Poderia descrever novamente o que está procurando?",
    findingMostRelevantMatches: "Encontrando correspondências mais relevantes",
    loadingPreviousChat: "Carregando chat anterior...",
    thinking: "Pensando...",
    // New feature section
    comingSoonFeatures: "Em breve",
    virtualFitPreviewTitle: "Provador Virtual",
    virtualFitPreviewSubtitle: "Visualize como as roupas se ajustam a você antes de comprar.",
    personalizedStyleFeedTitle: "Feed de Estilo",
    personalizedStyleFeedSubtitle: "Descubra sugestões de looks personalizados e últimas tendências.",
    smartFashionAssistantTitle: "Assistente de Moda Smart",
    smartFashionAssistantSubtitle: "Converse com um especialista de moda que lembra e evolui com seu estilo.",
    seamlessCheckoutTrackingTitle: "Checkout & Rastreamento Facilitado",
    seamlessCheckoutTrackingSubtitle: "Complete compras e acompanhe seus pedidos em um só lugar.",
    exclusiveDealsStockAlertsTitle: "Ofertas Exclusivas & Alertas",
    exclusiveDealsStockAlertsSubtitle: "Receba os melhores preços e seja notificado sobre coleçōes favoritos.",
    enterEmailPlaceholder: "Insira seu email...",
    stayInformedCTA: "Fique informado",
  }
};

// Get localized text based on current language
export const getLocalizedText = (
  language: keyof typeof localizations,
  key: keyof LocalizationStrings
): string => {
  return localizations[language][key] || key;
};

// Helper to set and get user language based on country
export const getUserLanguage = (country: string): keyof typeof localizations => {
  const countryCode = country.toLowerCase();
  if (countryCode === "br" || countryCode === "brazil") {
    return "brazilian_portuguese";
  }
  // Add more country codes and corresponding languages as needed
  return "english";
};
