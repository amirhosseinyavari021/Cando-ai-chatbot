// frontend/src/hooks/useChat.js
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
// FIX: This import will now work correctly because we fixed api/ai.js
import { getAIResponse } from '../api/ai';

/**
 * Custom hook to manage the chat state and interactions.
 * (REWRITTEN: Removed all localStorage persistence for an ephemeral chat experience)
 *
 * @returns {object} Chat state and actions.
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // FIX: Always create a new, fresh conversationId on mount.
  const [conversationId, setConversationId] = useState(uuidv4);

  // --- Chat Actions ---

  /**
   * Starts a new chat session.
   * (Now simply clears the state)
   */
  const startNewChat = useCallback(() => {
    // Create a new ID for the new session
    setConversationId(uuidv4());
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Adds a new message and gets a response from the AI.
   * @param {string} content - The content of the user's message.
   */
  const addMessage = useCallback(async (content) => {
    const userMessage = {
      id: uuidv4(),
      sender: 'user',
      content: content,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update UI
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Send message to backend (backend will log this using updateMemory)
      // FIX: This call now matches the corrected api/ai.js
      const response = await getAIResponse(content, conversationId);

      const botMessage = {
        id: uuidv4(),
        sender: 'bot',
        content: response.message, // This can be string or { type: 'roadmap', ... }
        timestamp: new Date().toISOString(),
      };

      // Update UI with bot's response
      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (err) {
      console.error('Failed to get AI response:', err);
      setError('Failed to get response. Please try again.');

      // Create a specific error message for the user
      const errorMessage = {
        id: uuidv4(),
        sender: 'bot',
        content: 'Sorry, I ran into an error. Please try again.',
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);

    } finally {
      setIsLoading(false);
    }
  }, [conversationId]); // 'messages' removed from dependency array

  return {
    messages,
    addMessage,
    isLoading,
    error,
    startNewChat,
  };
};