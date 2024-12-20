// localization.ts
// Define the localization type to ensure consistency across languages
export type LocalizationStrings = {
  appName: string;
  newChat: string;
  free: string;
  country: string;
  selectCountry: string;
  editProfile: string;
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
  feedbackPrompt: string;
  feedbackPopupPrompt: string;
  feedbackPlaceholder: string;
  cancelFeedback: string;
  submitFeedback: string;
  // edit profile
  emailConfirmYes: string;
  emailConfirmNo: string;
  emailPromptCorrect: string;
  redoProfile: string;
  profilePromptBetterResults: string;
  confirmProfileRedirect: string;
  dismissProfileRedirect: string;
  profileIntro: string;
  profileName: string;
  profileQ1: string;
  profileQ2: string;
  profileQ3: string;
  profileQ4: string;
  profileQ5: string;
  profileQ6: string;
  profileQ7: string;
  profileQ8: string;
  profileQ9: string;
  profileAnswerPlaceholder: string;
  profileSuccess: string;
  profileEditIntro: string;
  invalidNumber: string;
  selectAtLeastOneBrand: string;
  submit: string;
  postalCode: string;
  city: string;
  state: string;
  countrySelect: string;
  cutGenderMale: string;
  cutGenderFemale: string;
  cutGenderOther: string;

  // waitingFeedback
  waitingFeedback: string;
  waitingBuy: string;

  // prompts follow up
  regenerateIt: string;
  
  modifyLookRemoveItem: string;
  modifyLookAddItem: string;
  modifyLookAlterItem: string;
  modifyAlterItem: string;
  
  lovedItItem: string;
  lovedItLook: string;

  // go back
  goBackResponse: string;
};

export const localizations: Record<"english" | "brazilian_portuguese", LocalizationStrings> = {
  english: {
    appName: "Closy AI",
    newChat: "New Chat",
    free: "Free",
    country: "Country",
    selectCountry: "Select country",
    editProfile: "Edit Profile",
    logout: "Logout",
    guest: "Guest",
    tier: "Free",
    callPrompt: "Find the look you always looked for",
    callMainPrompt: "Looking to buy something specific?",
    callHomePrompt: "Need outfit inspiration?",
    introMessage: "What specific fashion piece you want to find?",
    introMainMessage: "I’ll hunt down the perfect outfit for you!",
    introHomeMessage: " I’ll create the perfect combination for your plans!",
    describeItem: "Describe the item in details...",
    sendMessage: "Type more...",
    examplePrompt1: "Find dress with thin shoulder straps",
    examplePrompt2: "I want a pink set for the gym",
    examplePrompt3: "I need a short jeans skirt with buttons",
    exampleMainPrompt1: "I want a look for a family Christmas dinner",
    exampleMainPrompt2: "Fashion tips for New Year's Eve?",
    exampleMainPrompt3: "Outfits matching for a rodeo party",
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
    visitProduct: "See product",
    feedbackPrompt: "How was your experience?",
    feedbackPopupPrompt: "Please tell us more about your experience",
    feedbackPlaceholder: "Your feedback...",
    cancelFeedback: "Cancel",
    submitFeedback: "Submit",
    // edit profile
    emailConfirmYes: "Yes",
    emailConfirmNo: "No",
    emailPromptCorrect: "What is your correct email?",
    redoProfile: "Redo Profile",
    profilePromptBetterResults: "Not satisfied? Let's personalize your results!",
    confirmProfileRedirect: "Yes, let's go",
    dismissProfileRedirect: "Continue chat",
    profileIntro: "Hi, let's update your profile with a few quick questions. For better results, we encourage you to think of your authentic answers, but we provide some examples for inspiration. Is this your email: ",
    profileName: "How should I call you?",
    profileQ1: "1. Which clothing fit do you prefer?",
    profileQ2: "2. What is your age (e.g., 27)?",
    profileQ3: "3. What is your height in cm (e.g., 165)?",
    profileQ4: "4. What is your weight in pounds (e.g., 145)?",
    profileQ5: "5. What is your shoe size (e.g., 7)?",
    profileQ6: "6. What is your usual shirt size?",
    profileQ7: "7. What is your usual pants size?",
    profileQ8: "8. What is your address? Please provide postal code, city, state, and country.",
    profileQ9: "9. Select your favorite brands:",
    profileAnswerPlaceholder: "Type your answer here...",
    profileSuccess: "Profile saved successfully! Redirecting...",
    profileEditIntro: "Let's edit your profile. I will ask the questions again so you can update your answers.",
    invalidNumber: "Please enter a valid number.",
    selectAtLeastOneBrand: "Please select at least one brand.",
    submit: "Submit",
    postalCode: "Zip Code",
    city: "City (e.g., San Francisco)",
    state: "State (e.g., CA)",
    countrySelect: "Country (e.g., United States)",
    cutGenderMale: "Male",
    cutGenderFemale: "Female",
    cutGenderOther: "Other/Neutral",

    // waiting
    waitingFeedback: "What do you think?",
    waitingBuy: "We don't have this feature yet, click on the cards to buy on the ecommerces!",

    // prompts follow up
    regenerateIt: "Didn't like it, I wanted...",

    modifyLookRemoveItem: "Remove item from look...",
    modifyLookAddItem: "Add item to look...",
    modifyLookAlterItem: "Change item in look for...",
    modifyAlterItem: "Hmm, change item to...",

    lovedItItem: "I want to buy item...",
    lovedItLook: "I want to buy the look...",

    // go back
    goBackResponse: "Delete last message",
  },
  brazilian_portuguese: {
    appName: "Closy AI",
    newChat: "Novo Chat",
    free: "Grátis",
    country: "País",
    selectCountry: "Selecione o país",
    editProfile: "Editar perfil",
    logout: "Sair",
    guest: "Convidado",
    tier: "Grátis",
    callPrompt: "Encontre o look que sempre procurou",
    callMainPrompt: "Procurando algo específico?",
    callHomePrompt: "Precisa de inspiração para look?",
    introMessage: "Qual peça específica de moda você quer encontrar?",
    introHomeMessage: "Vou criar a combinação perfeita para seus planos!",
    introMainMessage: "Eu vou criar o look perfeito pros seus planos!",
    describeItem: "Descreva em detalhes o item...",
    sendMessage: "Escreva mais...",
    examplePrompt1: "Estou procurando um vestido de alças finas",
    examplePrompt2: "Quero um conjunto rosa para academia",
    examplePrompt3: "Preciso de uma saia jeans curta com botões",
    exampleMainPrompt1: "Quero um look para a ceia de Natal em família",
    exampleMainPrompt2: "Dicas de roupas para o reveillon?",
    exampleMainPrompt3: "Roupas combinando para festa de rodeio",
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
    visitProduct: "Ver produto",
    feedbackPrompt: "Como foi sua experiência?",
    feedbackPopupPrompt: "Por favor conte mais sobre sua experiência",
    feedbackPlaceholder: "Seu feedback...",
    cancelFeedback: "Cancelar",
    submitFeedback: "Submeter",
    // edit profile
    emailConfirmYes: "Sim",
    emailConfirmNo: "Não",
    emailPromptCorrect: "Qual é o seu e-mail correto?",
    redoProfile: "Refazer Perfil",
    profilePromptBetterResults: "Não está satisfeito? Vamos personalizar seus resultados!",
    confirmProfileRedirect: "Sim, vamos lá",
    dismissProfileRedirect: "Continuar chat",
    profileIntro: "Olá, vamos atualizar seu perfil com algumas perguntas rápidas. Para melhores resultados, incentivamos você a pensar em suas respostas autênticas, mas fornecemos alguns exemplos para inspiração. Este é o seu e-mail: ",
    profileName: "Como posso chamar você?",
    profileQ1: "1. Qual é o corte de roupa que você prefere?",
    profileQ2: "2. Qual é a sua idade (ex.: 27)?",
    profileQ3: "3. Qual é a sua altura em cm (ex.: 165)?",
    profileQ4: "4. Qual é o seu peso em quilogramas (ex.: 60)?",
    profileQ5: "5. Qual é o seu número de calçado (ex.: 36)?",
    profileQ6: "6. Qual é o seu tamanho padrão de camisetas/camisas que costuma comprar?",
    profileQ7: "7. Qual é o seu tamanho padrão de calças que costuma comprar?",
    profileQ8: "8. Qual é o seu endereço? Por favor, forneça código postal, cidade, estado e país.",
    profileQ9: "9. Selecione suas marcas preferidas:",
    profileAnswerPlaceholder: "Digite sua resposta aqui...",
    profileSuccess: "Perfil salvo com sucesso! Redirecionando...",
    profileEditIntro: "Vamos editar seu perfil. Vou fazer as perguntas novamente para que você possa atualizar suas respostas.",
    invalidNumber: "Por favor, insira um número válido.",
    selectAtLeastOneBrand: "Por favor, selecione pelo menos uma marca.",
    submit: "Enviar",
    postalCode: "Código Postal",
    city: "Cidade (ex.: Rio de Janeiro)",
    state: "Estado (ex.: SP)",
    countrySelect: "País (ex.: Brasil)",
    cutGenderMale: "Masculino",
    cutGenderFemale: "Feminino",
    cutGenderOther: "Outro/Neutro",

    // waitingFeedback
    waitingFeedback: "O que você achou?",
    waitingBuy: "Ainda não temos essa feature, clique nos cards para comprar nos ecommerces!",

    // prompts follow up
    regenerateIt: "Não gostei, queria que...",

    modifyLookRemoveItem: "Remova item do look...",
    modifyLookAddItem: "Adicione item ao look...",
    modifyLookAlterItem: "Altere o item do look por...",
    modifyAlterItem: "Hmm, altere o item...",

    lovedItItem: "Quero comprar...",
    lovedItLook: "Quero comprar o look...",

    // go back
    goBackResponse: "Apagar última mensagem",
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
