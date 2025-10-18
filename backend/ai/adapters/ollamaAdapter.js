import axios from 'axios';

// System prompt for the text model (e.g., llama3)
const TEXT_SYSTEM_PROMPT = `
You are CandoBot, a professional and friendly AI assistant for "Cando Training Center".
Your primary task is to answer questions strictly related to Cando Academy: courses, instructors, schedules, registration procedures, academic consulting, and guidance provided by Cando.

**CRITICAL RULES:**
1.  **Language:** Understand the user's query language (Persian or English). Process the request based on these English instructions, BUT ALWAYS formulate your final response in the SAME language the user used. Use clear, simple, and common vocabulary in the user's language. Strictly avoid jargon or foreign words unless absolutely necessary (like technical terms).
2.  **Style:** Your answers must be accurate, helpful, very clear, and step-by-step when appropriate. Maintain a friendly yet professional tone.
3.  **Topic Restriction:** If the user's question is COMPLETELY unrelated to Cando Academy (e.g., general knowledge, history, unrelated science, personal opinions, coding help not related to Cando courses), you MUST refuse. Your ONLY valid response in this case is: "I am the Cando assistant and can only help with information about Cando courses, consultations, and guidance." Provide absolutely no other explanation.
4.  **Conciseness:** Keep answers as brief and to the point as possible while remaining helpful. Avoid long, complex sentences.
`;

// System prompt for the multimodal model (e.g., llava-llama3)
const VISION_SYSTEM_PROMPT = `
You are an image analysis assistant for "Cando Training Center".
Your task is to analyze the image provided by the user *only* if it is directly related to one of the following:
- Parts of the Cando website or educational platforms (for reporting issues or asking questions).
- The interior or exterior environment of the Cando Academy building.
- Educational content directly related to Cando courses (e.g., slides, code snippets shown in class).

**CRITICAL RULES:**
1.  **Restricted Analysis:** Only analyze the image within the context of the user's question AND its relevance to Cando. Do not provide general descriptions or unrelated information.
2.  **Language:** Understand the user's query language (Persian or English). Process the image based on these English instructions, BUT ALWAYS formulate your final response in the SAME language the user used. Use clear, simple, and accurate language.
3.  **Reject Irrelevant Images:** If the provided image is NOT related to the allowed topics above, you MUST refuse. Your ONLY valid response in this case is: "Sorry, I can only analyze images directly related to Cando Academy, its website, or course materials."
`;

/**
 * Sends a prompt (and optional image) to the local Ollama service.
 * Determines the correct model based on input.
 * @param {string} prompt - The user's text query.
 * @param {string | null} imageBase64 - The base64 encoded image string (if any).
 * @returns {Promise<string>} The AI's response text.
 */
export const queryOllama = async (prompt, imageBase64 = null) => {
  // Use default Ollama URL if not set in environment variables
  const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  // Use the /api/generate endpoint for flexibility with both models
  const OLLAMA_ENDPOINT = `${OLLAMA_API_URL}/api/generate`;

  let payload;
  let modelToUse;

  if (imageBase64) {
    // Multimodal processing state
    modelToUse = 'llava-llama3'; // As requested by user
    console.log(`Processing request with Multimodal model (${modelToUse})...`);
    payload = {
      model: modelToUse,
      prompt: prompt, // User's question about the image
      system: VISION_SYSTEM_PROMPT,
      images: [imageBase64.split(',')[1]], // Remove the "data:image/..." prefix
      stream: false,
    };
  } else {
    // Text-Only processing state
    modelToUse = 'llama3'; // As requested by user
    console.log(`Processing request with Text model (${modelToUse})...`);
    payload = {
      model: modelToUse,
      prompt: prompt,
      system: TEXT_SYSTEM_PROMPT,
      stream: false,
    };
  }

  console.log(`Sending request to Ollama endpoint: ${OLLAMA_ENDPOINT} with model: ${modelToUse}`);

  try {
    // Increased timeout for potentially slow initial loads
    const response = await axios.post(OLLAMA_ENDPOINT, payload, { timeout: 120000 });

    if (response.data && response.data.response) {
      console.log(`Received response from ${modelToUse}.`);
      // Return the trimmed response text
      return response.data.response.trim();
    } else {
      console.error('Invalid response structure from Ollama API:', response.data);
      throw new Error('Invalid response structure from Ollama API');
    }
  } catch (error) {
    // Handle different types of errors
    if (error.code === 'ECONNREFUSED') {
      console.error(`Ollama API unreachable at ${OLLAMA_API_URL}. Is the service running?`);
      throw new Error(`Ollama API unreachable at ${OLLAMA_API_URL}. Is the service running?`);
    } else if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('timeout'))) {
      const timeoutDuration = error.config && error.config.timeout ? error.config.timeout : 'N/A';
      console.error(`Ollama model (${modelToUse}) timed out after ${timeoutDuration}ms.`);
      throw new Error(`The AI model (${modelToUse}) took too long to respond. Please try again.`);
    } else {
      // Log detailed error for other cases
      const errorDetails = error.response ? error.response.data : error.message;
      console.error(`Error querying Ollama (${modelToUse}):`, errorDetails);
      throw new Error('Failed to get response from Ollama model.');
    }
  }
};