const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/

export const isRtl = (text: string): boolean => {
  if (!text) return true
  const first = text.match(/[a-zA-Z\u0590-\u05FF\u0600-\u06FF]/)
  if (first) return rtlRegex.test(first[0])
  return true
}
