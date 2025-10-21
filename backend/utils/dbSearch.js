import Faq from '../models/Faq.js'; // Import Faq model

const MAX_CONTEXT_LENGTH = 1500; // Limit context size for OpenAI prompt

/**
 * Searches the Faq collection for relevant documents based on keywords.
 * @param {string} query - The user's query.
 * @param {number} limit - Maximum number of results to return.
 * @returns {Promise<string>} A concatenated string of relevant answers.
 */
export const searchFaqs = async (query, limit = 3) => {
  try {
    console.log(`Searching FAQs for: "${query}"`);
    // Use MongoDB's text search feature
    const results = await Faq.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } } // Project the relevance score
    )
    .sort({ score: { $meta: "textScore" } }) // Sort by relevance
    .limit(limit);

    if (!results || results.length === 0) {
      console.log("No relevant FAQs found in DB.");
      return ""; // Return empty string if no results
    }

    console.log(`Found ${results.length} relevant FAQs.`);

    // Combine the answers into a single context string, respecting length limit
    let context = "Relevant information from database:\n";
    for (const faq of results) {
      const faqText = `- Q: ${faq.question}\n- A: ${faq.answer}\n\n`;
      if (context.length + faqText.length <= MAX_CONTEXT_LENGTH) {
        context += faqText;
      } else {
        break; // Stop adding if context gets too long
      }
    }
    return context;

  } catch (error) {
    console.error("Error searching Faqs collection:", error);
    return ""; // Return empty string on error
  }
};