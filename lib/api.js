// api.js
// const API_BASE_URL = 'http://localhost:4000';
const API_BASE_URL = 'https://estoque-server-df0876ed2a97.herokuapp.com';

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

// Sign up a user
export function signupUser(email, country) {
  return request('/signupUser', 'POST', { email, country });
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
export function createChat(userEmail, message) {
  return request('/createChat', 'POST', { userEmail, message });
}

// Check chat with the entire conversation
export function checkChat(conversation, language) {
  return request('/checkChat', 'POST', { conversation, language });
}

// Update chat streaming 
export const updateChatStream = async (chatId, conversation, country, language) => {
  try {
    const response = await fetch(`${API_BASE_URL}/updateChat/${chatId}`, { // Fixed BASE_URL to API_BASE_URL
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
