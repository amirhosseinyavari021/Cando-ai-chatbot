import axios from 'axios';

// --- OpenRouter Configuration ---
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Using the specified free model from OpenRouter
const OPENROUTER_MODEL = 'openai/gpt-oss-20b:free';
// --- End Configuration ---

/**
 * Sends a structured prompt to the OpenRouter API.
 * @param {string} systemPrompt - The system message defining the AI's persona and rules.
 * @param {string} context - Relevant information retrieved from the database.
 * @param {string} userQuery - The user's original question.
 * @param {object} cancelToken - Axios cancel token for stopping generation.
 * @returns {Promise<string>} The AI's response text.
 */
// Renamed function slightly for clarity
export const queryOpenRouter = async (systemPrompt, context, userQuery, cancelToken) => {
  // Use the new environment variable name
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("OpenRouter API Key (OPENROUTER_API_KEY) is not set in environment variables.");
    throw new Error("OpenRouter service is not configured.");
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...(context ? [{ role: "system", content: `Use the following information to answer the user's question:\n${context}` }] : []),
    { role: "user", content: userQuery }
  ];

  console.log(`Sending request to OpenRouter model: ${OPENROUTER_MODEL}`);

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: OPENROUTER_MODEL,
        messages: messages,
        // Optional: Add parameters like temperature if needed
        // temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          // Recommended headers for OpenRouter
          'HTTP-Referer': 'http://localhost', // Replace with your actual site URL in production
          'X-Title': 'Cando AI Chatbot' // Your project name
        },
        cancelToken: cancelToken
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      console.log(`Received response from ${OPENROUTER_MODEL}.`);
      return response.data.choices[0].message.content.trim();
    } else {
      console.error("Invalid response structure from OpenRouter API:", response.data);
      throw new Error("Invalid response structure from OpenRouter API");
    }

  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('OpenRouter request canceled:', error.message);
      throw error;
    }
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`Error querying OpenRouter (${OPENROUTER_MODEL}):`, errorDetails);

    let userErrorMessage = 'Failed to get response from the AI model via OpenRouter.';
    if (error.response?.status === 401) {
      userErrorMessage = 'OpenRouter API key is invalid or missing.';
    } else if (error.response?.status === 429) {
      userErrorMessage = 'OpenRouter rate limit or quota exceeded. The free model may have usage limits.';
    } else if (error.response?.data?.error?.message) {
      userErrorMessage = `OpenRouter Error: ${error.response.data.error.message}`; // Use OpenRouter's specific error
    }
    throw new Error(userErrorMessage);
  }
};