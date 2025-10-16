import axios from 'axios';

const SYSTEM_PROMPT = `You are a professional, friendly assistant for "Cando Training Center". 
Your name is CandoBot.
You MUST answer questions ONLY about Cando's courses, instructors, schedules, registration processes, consultation services, and educational guidance.
If a user asks about any topic not related to Cando (e.g., general knowledge, personal opinions, coding help), you MUST politely refuse. Your ONLY valid response in this case is: "I’m your Cando assistant. I can only help with information about Cando courses, consultation, and guidance."
Your answers must be clear, concise, and helpful. Always answer in the same language as the user's question (Persian or English).`;

export const queryOllama = async (prompt) => {
  const OLLAMA_URL = `${process.env.OLLAMA_BASE_URL}/api/chat`;

  try {
    const response = await axios.post(
      OLLAMA_URL,
      {
        model: 'llama3',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
        stream: false,
      },
      { timeout: 20000 }
    );
    if (response.data && response.data.message && response.data.message.content) {
      return response.data.message.content.trim();
    } else {
      throw new Error('Invalid response structure from Ollama API');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
      throw new Error('Ollama API unreachable. Please ensure the service is running.');
    }
    console.error('Error querying Ollama:', error.message);
    throw new Error('Failed to get response from Ollama model.');
  }
};