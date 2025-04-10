import crypto from 'crypto';

// api.js
export const API_BASE_URL = 'http://localhost:4000';
// export const API_BASE_URL = 'https://estoque-server-df0876ed2a97.herokuapp.com';

// export const CONVERSION_RATE = 6;

// Helper function to send requests
async function request(url, method, body) {
  const token = localStorage.getItem('token');
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, options);

  if (!response.ok) {
    let errorMessage = 'API request failed';
    let status = response.status;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }

    const error = new Error(errorMessage);
    error.status = status;
    throw error;
  }

  return response.json();
}

// Logout function to remove the JWT token
export function logout() {
  localStorage.removeItem('token');
}

// Helper function to send MetaPixel event
async function sendMetaPixelEvent(email, city, state, postal, country, ipAddress, userAgent, fbclid=null) {
  async function hashData(data) {
    crypto.createHash('sha256')
    .update(data.trim().toLowerCase())
    .digest('hex');
  }

  const accessToken = 'EAAzYVymWkjEBO8vgR7ZCEsTyCgOeX0h3ruL1KH2KdSMZBwvksulXp4Rcm6HqWJuAbP23fZBXIdrF04HAEs68sZBKGvwI9m68uMfSoMh6KBDV88pasc1xO1AR9loBHW0FpD6TEPaKF1SPjtjQiuPNGDu2tA6zCMAl6HiaNWryB35LnZBkAXDsZBuVMplyedH4zHGwZDZD';
  const pixelId = '3893394874241911';
  const url = `https://graph.facebook.com/v17.0/${pixelId}/events`;

  console.log(email)
  console.log(city)
  console.log(state)
  console.log(postal)
  console.log(country)
  console.log(ipAddress)
  console.log(userAgent)
  console.log(fbclid)

  const userData = {
    em: await hashData(email),         // Email (hashed)
    ct: await hashData(city),          // City (hashed)
    st: await hashData(state),         // State (hashed)
    zp: await hashData(postal),           // Zip Code (hashed)
    country: await hashData(country),  // Country (hashed)
    client_ip_address: ipAddress,      // Client IP (not hashed)
    client_user_agent: userAgent,      // User Agent (not hashed)
    fbc: fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}` : null, // Facebook Click ID
  };

  const payload = {
    data: [
      {
        event_name: 'Lead', // Standard event name
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: userData,
      },
    ],
    access_token: accessToken,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to send MetaPixel event:', errorText);
  }

  return response;
}

// Sign up a user
export async function signupUser(email) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    // if user email already there skip
    const storedEmail = urlParams.get('email');
    if(storedEmail) return;

    // get fbclid
    const fbclid = urlParams.get('fbclid');

    // do ip thing
    const responseIp = await fetch('https://ipinfo.io/json?token=b6b14cb98c9cd1');
    const data = await responseIp.json();

    const ipAddress = data.ip;
    const userAgent = navigator.userAgent;

    // Fetch geolocation data using the IP address
    let city = '-', state = '-', postal = '-', country = 'br';
    try {
      const geoResponse = await fetch(`https://ipinfo.io/${ipAddress}?token=b6b14cb98c9cd1`);
      const geoData = await geoResponse.json();
      postal = geoData.postal || '-';
      city = geoData.city || '-';
      state = geoData.region || '-';
      country = geoData.country.toLowerCase() || 'br';
    } catch (error) {
      console.error('Error fetching geolocation data:', error.message);
    }

    // Sign up the user via your API
    const result = await request('/signupUser', 'POST', { email, postal, city, state, country });

    // Send MetaPixel event
    const pixelResult = await sendMetaPixelEvent(email, city, state, postal, country, ipAddress, userAgent, fbclid);
    console.log("pixelResult",pixelResult);
    console.log("signupResult",result);
    return result;
  } catch (error) {
    console.error('Error signing up user:', error);
    throw error;
  }
}

export async function signin(email, password) {
  try {
    // Call the /signin endpoint with email and password
    const result = await request('/signin', 'POST', { email, password });
    return result; // Expecting a JSON object with a token property, for example { token: '...' }
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Update user data
export function updateUser(newUser) {
  return request('/updateUser', 'POST', newUser);
}

// Remove (deactivate) a user
export function removeUser(email) {
  return request('/removeUser', 'POST', { email });
}

// Save star rating feedback
 export function saveStarsFeedback(chatId, rating) {
  return request('/saveStarsFeedback', 'POST', { chatId, rating });
};

// Save open feedback
 export function saveOpenFeedback(chatId, feedback) {
  return request('/saveOpenFeedback', 'POST', { chatId, feedback });
};

// Get all chats
export function getChats() {
  return request('/getChats', 'GET');
}

// Get chat states aggregation
export function getChatStates() {
  return request('/getChatStates', 'GET');
}

// Get funnel analytics data
export function getFunilAnalytics(sellerId) {
  return request(`/getFunilAnalytics?sellerId=${sellerId}`, 'GET');
}

// Get all chats
export function getUsers() {
  return request('/getUsers', 'GET');
}

// Create a new chat
export function createChat(userEmail, message, language) {
  return request('/createChat', 'POST', { userEmail, message, language });
}

// Send a direct WhatsApp message from the store phone to the user phone.
export function sendDirectMessage(from, to, text, image, caption) {
  return request('/sendMessage', 'POST', { from, to, message: text, image, caption });
}

// Toggle intervention
export function toggleIntervention(from, to) {
  return request('/toggleIntervention', 'POST', { from, to });
}

// Helper function to parse conversations
function parseConversation(conversation) {
  const lastBotArrayMessageIndex = conversation
    .map((entry, index) => entry?.bot && Array.isArray(entry?.bot?.message) ? index : -1)
    .filter(index => index !== -1)
    .pop(); // Get the last valid index

  return conversation.map((entry, index) => {
    if (entry?.bot && Array.isArray(entry?.bot?.message)) {
      if (index !== lastBotArrayMessageIndex) {
        return {
          ...entry,
          bot: {
            ...entry?.bot,
            message: "PREVIOUS_ITERATION",
          },
        };
      }
    }
    // Return the original entry if conditions are not met
    return entry;
  });
}

// Check chat with the entire conversation
export function checkChat(conversation, language) {
  const parsedConversation = parseConversation(conversation);
  return request('/checkChat', 'POST', { conversation: parsedConversation, language });
}

// Check chat with talk for the entire conversation
export function checkChatWithTalk(conversation, language) {
  const parsedConversation = parseConversation(conversation);
  return request('/checkChatWithTalk', 'POST', { conversation: parsedConversation, language });
}

// Check chat with talk for the entire conversation tuned
export function checkChatWithTalkTuned(conversation, language) {
  const parsedConversation = parseConversation(conversation);
  return request('/checkChatWithTalkTuned', 'POST', { conversation: parsedConversation, language });
}

// Undo last chat messages
export async function undoLastChatMessages(chatId) {
  const response = await fetch(`${API_BASE_URL}/undoLastChat/${chatId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw data;
  }

  // If API returns the updated conversation
  if (data.success && data.updatedConversation) {
    return data.updatedConversation;
  } else {
    // Fetch and return updated chat if not provided by API
    const chats = await getChats();
    const updatedChat = chats.find(chat => chat.id === chatId);
    return updatedChat ? updatedChat.conversation : [];
  }
}

// Update chat messages
export const updateChatMessages = (chatId, updatedConversation, searchType, userLanguage) => {
  const parsedConversation = parseConversation(updatedConversation);

  fetch(`${API_BASE_URL}/updateChat/${chatId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversation: parsedConversation, searchType, language: userLanguage }),
  })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      if (data.status === "success" && data.data?.conversation) {
        return (data.data.conversation);
      }
    })
    .catch(error => {
      console.error('Error updating chat:', error);
      const botMessage = {
        bot: {
          "in-progress": false,
          "progress-message": "",
          message: "",
        },
      };
      return (prev => [...prev, botMessage]);
    });
  return []
};

// Update chat messages with follow-up
export async function updateChatMessagesFollowUp(chatId, updatedConversation, userLanguage) {
  const parsedConversation = parseConversation(updatedConversation);

  const response = await fetch(`${API_BASE_URL}/followUpChat/${chatId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversation: parsedConversation, language: userLanguage }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw data;
  }

  // Return updated conversation or fetch from chats if not provided
  if (data.success && data.updatedConversation) {
    return data.updatedConversation;
  } else {
    const chats = await getChats();
    const updatedChat = chats.find(chat => chat.id === chatId);
    return updatedChat ? updatedChat.conversation : updatedConversation;
  }
}
