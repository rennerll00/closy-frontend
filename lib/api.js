import crypto from 'crypto';

// api.js
const API_BASE_URL = 'http://localhost:4000';
// const API_BASE_URL = 'https://estoque-server-df0876ed2a97.herokuapp.com';

// Helper function to send requests
async function request(url, method, body) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
  const response = await fetch(`${API_BASE_URL}${url}`, options);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
}

// Helper function to send MetaPixel event
async function sendMetaPixelEvent(email, country, fbclid=null) {
  async function hashData(data) {
    crypto.createHash('sha256')
    .update(data.trim().toLowerCase())
    .digest('hex');
  }

  const accessToken = 'EAAzYVymWkjEBO8vgR7ZCEsTyCgOeX0h3ruL1KH2KdSMZBwvksulXp4Rcm6HqWJuAbP23fZBXIdrF04HAEs68sZBKGvwI9m68uMfSoMh6KBDV88pasc1xO1AR9loBHW0FpD6TEPaKF1SPjtjQiuPNGDu2tA6zCMAl6HiaNWryB35LnZBkAXDsZBuVMplyedH4zHGwZDZD';
  const pixelId = '3893394874241911';
  const url = `https://graph.facebook.com/v17.0/${pixelId}/events`;

  const responseIp = await fetch('https://ipinfo.io/json?token=b6b14cb98c9cd1');
  const data = await responseIp.json();

  const ipAddress = data.ip;
  const userAgent = navigator.userAgent;

  // Fetch geolocation data using the IP address
  let city = '-', state = '-', postal = '-';
  try {
    const geoResponse = await fetch(`https://ipinfo.io/${ipAddress}?token=b6b14cb98c9cd1`);
    const geoData = await geoResponse.json();
    city = geoData.city || '-';
    state = geoData.region || '-';
    postal = geoData.postal || '-';
  } catch (error) {
    console.error('Error fetching geolocation data:', error.message);
  }

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
export async function signupUser(email, country) {
  try {
    // Sign up the user via your API
    const result = await request('/signupUser', 'POST', { email, country });

    // get fbclid
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');

    // Send MetaPixel event
    const pixelResult = await sendMetaPixelEvent(email, country, fbclid);
    console.log("pixelResult",pixelResult);

    return result;
  } catch (error) {
    console.error('Error signing up user:', error);
    throw error;
  }
}

// Update user data
export function updateUser(email, country) {
  return request('/updateUser', 'POST', { email, country });
}

// Remove (deactivate) a user
export function removeUser(email) {
  return request('/removeUser', 'POST', { email });
}

// Get all chats
export function getChats() {
  return request('/getChats', 'GET');
}

// Create a new chat
export function createChat(userEmail, message, language) {
  return request('/createChat', 'POST', { userEmail, message, language });
}

// Check chat with the entire conversation
export function checkChat(conversation, language) {
  return request('/checkChat', 'POST', { conversation, language });
}

// Update chat streaming 
export const updateChatStream = async (chatId, conversation, country, language) => {
  try {
    const response = await fetch(`${API_BASE_URL}/updateChat/${chatId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation, country, language }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to update chat stream');
    }

    // Return the reader to handle the stream
    return response.body.getReader();
  } catch (error) {
    console.error('Error updating chat stream:', error);
    throw error;
  }
};

// Update chat
export function updateChat(chatId, conversation, language) {
  return request(`/updateChat/${chatId}`, 'POST', { conversation, language });
}
