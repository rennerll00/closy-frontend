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
  callMainPrompt: string;
  callHomePrompt: string;
  introMessage: string;
  introHomeMessage: string;
  introMainMessage: string;
  describeItem: string;
  sendMessage: string;
  examplePrompt1: string;
  examplePrompt2: string;
  examplePrompt3: string;
  exampleMainPrompt1: string;
  exampleMainPrompt2: string;
  exampleMainPrompt3: string;
  exampleMainPrompt4: string;
  exampleMainPrompt5: string;
  exampleHomePrompt1: string;
  exampleHomePrompt2: string;
  exampleHomePrompt3: string;
  exampleHomePrompt4: string;
  exampleHomePrompt5: string;
  exampleHomePrompt6: string;
  exampleHomePrompt7: string;
  exampleHomePrompt8: string;
  exampleHomePrompt9: string;
  exampleHomePrompt10: string;
  exampleHomePrompt11: string;
  exampleHomePrompt12: string;
  exampleHomePrompt13: string;
  exampleHomePrompt14: string;
  exampleHomePrompt15: string;
  exampleHomePrompt16: string;
  exampleHomePrompt17: string;
  exampleHomePrompt18: string;
  exampleHomePrompt19: string;
  exampleHomePrompt20: string;
  emailBetaPrompt: string;
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
  askEmail: string;
  invalidEmail: string;
  createChatError: string;
  updateChatError: string;
  createChatMutipleError: string;
  thanks: string;
  visitProduct: string;
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
    callMainPrompt: "Looking to buy something specific?",
    callHomePrompt: "Need outfit inspiration?",
    introMessage: "What specific fashion piece you want to find?",
    introMainMessage: "I’ll hunt down the perfect outfit for you!",
    introHomeMessage: " I’ll create the perfect look for your plans!",
    describeItem: "Describe the item in details...",
    sendMessage: "Type more...",
    examplePrompt1: "Find dress with thin shoulder straps",
    examplePrompt2: "I want a pink set for the gym",
    examplePrompt3: "I need a short jeans skirt with buttons",
    exampleMainPrompt1: "Pink Floral Print Short Dress with sleeves",
    exampleMainPrompt2: "Military Green Cargo Pants with side pockets",
    exampleMainPrompt3: "Black Tweed Blazer with golden buttons",
    exampleMainPrompt4: "Metallic mesh sleeveless top",
    exampleMainPrompt5: "5",
    exampleHomePrompt1: "🍸 What should I wear for a winter cocktail party?",
    exampleHomePrompt2: "☕ What's the perfect outfit for a casual first date?",
    exampleHomePrompt3: "🎵 What should I wear to a music festival in summer?",
    exampleHomePrompt4: "🎨 I need an outfit for a job interview in a creative industry.",
    exampleHomePrompt5: "🍳 What should I wear for brunch with my in-laws?",
    exampleHomePrompt6: "🎩 I'm going to a black-tie gala—what's a great look for me?",
    exampleHomePrompt7: "⛰️ What's a good outfit for a weekend getaway in the mountains?",
    exampleHomePrompt8: "🌇 What should I wear to a rooftop party at sunset?",
    exampleHomePrompt9: "✈️ I need a stylish but comfortable look for a long flight.",
    exampleHomePrompt10: "🍝 What's the perfect outfit for a romantic dinner date?",
    exampleHomePrompt11: "🏝️ What should I wear to a tropical destination wedding?",
    exampleHomePrompt12: "💼 What's a good outfit for an important client meeting in summer?",
    exampleHomePrompt13: "🍂 I need a chic outfit for a city sightseeing day in fall.",
    exampleHomePrompt14: "🎭 What should I wear to a themed costume party without overdoing it?",
    exampleHomePrompt15: "🏖️ What's a trendy outfit for a beach day that transitions to dinner?",
    exampleHomePrompt16: "🧘 What should I wear for an outdoor yoga session?",
    exampleHomePrompt17: "🎉 What's the best outfit for a New Year's Eve party?",
    exampleHomePrompt18: "🥕 I need a casual yet polished look for a weekend farmer's market.",
    exampleHomePrompt19: "📸 What should I wear for a holiday family photo shoot?",
    exampleHomePrompt20: "🏰 What's a comfortable yet stylish outfit for a day at Disneyland?",
    emailBetaPrompt: "Thanks so much for your interest in outfit recommendations! 🎉 This feature isn’t ready just yet, but we’re working hard to launch it soon. We’ll make sure to let you know the moment it’s available—stay tuned for the perfect looks from your favorite brands!",
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
    virtualFitPreviewTitle: "Virtual Try-On & Fitting",
    virtualFitPreviewSubtitle: "Guarantee that clothes will fit you before purchasing.",
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
    askEmail: "Before I go and help you, can you please provide an email for signup?",
    invalidEmail: "Oops, it seems like the email you provided is invalid. Could you please try again?",
    createChatError: "There was an error creating the chat",
    updateChatError: "There was an error creating the chat",
    createChatMutipleError: "There was an error creating the chat because more than one item was specified",
    thanks: "Thanks",
    visitProduct: "See product"
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
    callMainPrompt: "Procurando algo específico?",
    callHomePrompt: "Precisa de inspiração para uma certa ocasião",
    introMessage: "Qual peça específica de moda você quer encontrar?",
    introHomeMessage: "Eu vou encontrar o item perfeito para você!",
    introMainMessage: "Eu vou criar o look perfeito pros seus planos!",
    describeItem: "Descreva em detalhes o item...",
    sendMessage: "Escreva mais...",
    examplePrompt1: "Estou procurando um vestido de alças finas",
    examplePrompt2: "Quero um conjunto rosa para academia",
    examplePrompt3: "Preciso de uma saia jeans curta com botões",
    exampleMainPrompt1: "Vestido curto floral rosa com mangas",
    exampleMainPrompt2: "Calça cargo verde militar com bolsos laterais",
    exampleMainPrompt3: "Blazer preto de tweed com botões dourados",
    exampleMainPrompt4: "Top sem mangas de malha metálica",
    exampleMainPrompt5: "5",
    exampleHomePrompt1: "🍸 O que devo usar para uma festa de coquetel no inverno?",
    exampleHomePrompt2: "☕ Qual é o look perfeito para um encontro casual?",
    exampleHomePrompt3: "🎵 O que devo usar para um festival de música no verão?",
    exampleHomePrompt4: "🎨 Preciso de um look para uma entrevista em uma indústria criativa.",
    exampleHomePrompt5: "🍳 O que devo usar para um brunch com meus sogros?",
    exampleHomePrompt6: "🎩 Vou a um evento de gala formal—qual é um look incrível para mim?",
    exampleHomePrompt7: "⛰️ Qual é uma boa roupa para um fim de semana nas montanhas?",
    exampleHomePrompt8: "🌇 O que devo vestir para uma festa no terraço ao pôr do sol?",
    exampleHomePrompt9: "✈️ Preciso de um look estiloso e confortável para um voo longo.",
    exampleHomePrompt10: "🍝 Qual é o look perfeito para um jantar romântico?",
    exampleHomePrompt11: "🏝️ O que devo usar para um casamento em um destino tropical?",
    exampleHomePrompt12: "💼 Qual é uma boa roupa para uma reunião importante com cliente no verão?",
    exampleHomePrompt13: "🍂 Preciso de um look elegante para um dia de turismo na cidade no outono.",
    exampleHomePrompt14: "🎭 O que devo usar para uma festa à fantasia temática sem exagerar?",
    exampleHomePrompt15: "🏖️ Qual é um look moderno para um dia de praia que possa ir até o jantar?",
    exampleHomePrompt16: "🧘 O que devo vestir para uma sessão de yoga ao ar livre?",
    exampleHomePrompt17: "🎉 Qual é a melhor roupa para uma festa de Ano Novo?",
    exampleHomePrompt18: "🥕 Preciso de um look casual mas elegante para a feira de agricultores no fim de semana.",
    exampleHomePrompt19: "📸 O que devo usar para uma sessão de fotos em família para as festas?",
    exampleHomePrompt20: "🏰 Qual é uma roupa confortável e estilosa para um dia na Disneyland?",
    emailBetaPrompt: "Muito obrigado pelo seu interesse nas recomendações de looks! 🎉 Esta funcionalidade ainda não está pronta, mas estamos trabalhando arduamente para lançá-la em breve. Faremos questão de informá-lo assim que estiver disponível—fique atento para os looks perfeitos das suas marcas favoritas!",
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
    virtualFitPreviewTitle: "Provador & Ajuste Virtual",
    virtualFitPreviewSubtitle: "Garanta que as roupas caiam bem em você antes de comprar.",
    personalizedStyleFeedTitle: "Feed de Estilo",
    personalizedStyleFeedSubtitle: "Descubra sugestões de looks personalizados e últimas tendências.",
    smartFashionAssistantTitle: "Assistente de Moda Inteligente",
    smartFashionAssistantSubtitle: "Converse com um especialista de moda que lembra e evolui com seu estilo.",
    seamlessCheckoutTrackingTitle: "Checkout & Rastreamento Facilitado",
    seamlessCheckoutTrackingSubtitle: "Complete compras e acompanhe seus pedidos em um só lugar.",
    exclusiveDealsStockAlertsTitle: "Ofertas Exclusivas & Alertas",
    exclusiveDealsStockAlertsSubtitle: "Receba os melhores preços e seja notificado sobre suas coleções favoritas.",
    enterEmailPlaceholder: "Insira seu email...",
    stayInformedCTA: "Fique informado",
    askEmail: "Antes de eu ajudá-lo, você pode fornecer um email para o cadastro?",
    invalidEmail: "Oops, parece que o email que você forneceu é inválido. Poderia tentar novamente?",
    createChatError: "Houve um erro ao criar o chat",
    updateChatError: "Houve um erro ao update o chat",
    createChatMutipleError: "Houve um erro ao criar o chat porque mais de um item foi especificado",
    thanks: "Obrigado",
    visitProduct: "Ver produto"
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
  return "english";
};
