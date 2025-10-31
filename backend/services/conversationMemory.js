// backend/services/conversationMemory.js

const conversationStore = new Map();

export function getHistory(userId, maxTurns = 6) {
  const history = conversationStore.get(userId) || [];
  return history.slice(-maxTurns);
}

export function appendTurn(userId, turn) {
  if (!conversationStore.has(userId)) {
    conversationStore.set(userId, []);
  }
  const turns = conversationStore.get(userId);
  turns.push({ role: turn.role, content: turn.content, timestamp: Date.now() });

  if (turns.length > 10) turns.shift();
  conversationStore.set(userId, turns);
}
