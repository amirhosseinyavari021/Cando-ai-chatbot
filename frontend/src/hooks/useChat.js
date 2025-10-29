import { useState, useRef, useEffect } from 'react';
import { ask } from '../api';
import axios from 'axios'; // Import axios for CancelToken source

/**
 * Custom hook to manage the entire chat state machine.
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  // 'idle', 'loading', 'fallback', 'error'
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [cancelTokenSource, setCancelTokenSource] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup effect for unmounting
  useEffect(() => {
    return () => {
      cancelTokenSource?.cancel('Component unmounted.');
    };
  }, [cancelTokenSource]);

  /**
   * Appends a new message to the chat.
   * @param {object} message - The message object { sender, text, isError }
   */
  const addMessage = (message) => {
    // Give each message a unique ID for React keys
    setMessages((prev) => [...prev, { ...message, id: Date.now() }]);
  };

  /**
   * Handles sending a message to the API.
   * @param {string} promptText - The text from the user.
   */
  const sendMessage = async (promptText) => {
    if (status === 'loading' || status === 'fallback' || !promptText.trim()) {
      return;
    }

    // Add user's message
    addMessage({ sender: 'user', text: promptText });
    
    setStatus('loading');
    setError(null);

    // Create a new cancel token for this specific request
    const source = axios.CancelToken.source();
    setCancelTokenSource(source);

    try {
      // Call the API
      const data = await ask(promptText, source.token);

      // Check if fallback was triggered (for the UI)
      if (data.fallback) {
        setStatus('fallback'); // Show "fallback" text briefly in Loading
      }

      // Add bot's response
      addMessage({ sender: 'bot', text: data.message });
      setStatus('idle');
      
    } catch (err) {
      if (err.message === 'Cancelled') {
        // User cancelled the request
        addMessage({ sender: 'bot', text: 'Generation stopped.', isError: true });
        setStatus('idle'); // Go back to idle
      } else {
        // Handle API/network errors
        setError(err.message); // Set the user-friendly error message
        setStatus('error'); // Set error state
        // We don't add a bubble for the error, we'll show it in a separate div
      }
    } finally {
      // Clear the cancel token source once request is complete
      setCancelTokenSource(null);
    }
  };

  /**
   * Triggers the cancellation of the in-flight request.
   */
  const handleStopGenerating = () => {
    if (cancelTokenSource) {
      cancelTokenSource.cancel('User requested cancellation.');
    }
  };

  /**
   * Clears the current error message.
   */
  const clearError = () => {
    setError(null);
    if (status === 'error') {
      setStatus('idle'); // Reset to idle when error is cleared
    }
  };

  return {
    messages,
    status,
    error,
    sendMessage,
    handleStopGenerating,
    clearError,
    messagesEndRef,
  };
};