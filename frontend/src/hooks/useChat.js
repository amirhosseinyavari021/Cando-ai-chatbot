import { useState, useRef, useEffect } from 'react';
import { ask } from '../api/ai'; // Corrected import path

/**
 * Custom hook to manage the entire chat state machine.
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  // 'idle', 'loading', 'fallback', 'error'
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  // Use AbortController for cancellation
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup effect for unmounting
  useEffect(() => {
    // Abort any ongoing request when the component unmounts
    return () => {
      abortControllerRef.current?.abort('Component unmounted.');
    };
  }, []);

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

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('New message sent.');
    }

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Add user's message
    addMessage({ sender: 'user', text: promptText });

    setStatus('loading');
    setError(null);

    try {
      // Call the API with the signal
      const data = await ask(
        promptText,
        null, // userId (not implemented in old hook)
        null, // sessionId (not implemented in old hook)
        abortControllerRef.current.signal
      );

      // Check if fallback was triggered (for the UI)
      if (data.fallback) {
        setStatus('fallback'); // Show "fallback" text briefly in Loading
      }

      // Add bot's response
      addMessage({ sender: 'bot', text: data.message });
      setStatus('idle');

    } catch (err) {
      // Check if the error is due to cancellation
      if (err.name === 'CanceledError' || err.message === 'New message sent.' || err.message === 'User requested cancellation.') {
        console.log('Request cancelled');
        // If cancelled by a new message, stay loading
        // If cancelled by user (stop), go to idle
        if (err.message === 'User requested cancellation.') {
          addMessage({ sender: 'bot', text: 'Generation stopped.', isError: true });
          setStatus('idle');
        }
      } else {
        // Handle API/network errors
        setError(err.message || 'An unknown error occurred.'); // Set the user-friendly error message
        setStatus('error'); // Set error state
      }
    } finally {
      // Clear the AbortController ref once request is complete or cancelled
      abortControllerRef.current = null;
    }
  };

  /**
   * Triggers the cancellation of the in-flight request.
   */
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('User requested cancellation.');
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