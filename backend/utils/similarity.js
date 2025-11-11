// utils/similarity.js - ESM, no CommonJS. Node 22 safe.
// Lightweight cosine similarity + topK helper.

export function dot(a = [], b = []) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += a[i] * b[i];
  return s;
}

export function norm(a = []) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s) || 0;
}

export function cosineSim(a = [], b = []) {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  return dot(a, b) / (na * nb);
}

/**
 * topK by cosine similarity
 * @param {number[]} queryEmbedding
 * @param {{id?:string, text:string, meta?:any, embedding:number[] }[]} docs
 * @param {number} k
 */
export function topK(queryEmbedding, docs, k = 5) {
  const scored = [];
  for (const d of docs) {
    const score = cosineSim(queryEmbedding, d.embedding || []);
    scored.push({ ...d, score: Number.isFinite(score) ? score : 0 });
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, Math.max(0, k));
}
