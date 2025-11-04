import { useEffect, useLayoutEffect, useState } from 'react'

export const useAutoScroll = (
  ref: React.RefObject<HTMLElement>,
  messageCount: number
) => {
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const showJumpToBottom = !isAtBottom && !isUserScrolling

  const handleScroll = () => {
    if (!ref.current) return
    const { scrollTop, scrollHeight, clientHeight } = ref.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 100
    setIsAtBottom(atBottom)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = () => setIsUserScrolling(true)
    const onTouchStart = () => setIsUserScrolling(true)

    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      handleScroll()
      clearTimeout(timer)
      timer = setTimeout(() => setIsUserScrolling(false), 300)
    }

    el.addEventListener('wheel', onWheel)
    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('scroll', onScroll)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [ref])

  useLayoutEffect(() => {
    if (isUserScrolling || !ref.current) return
    if (isAtBottom) {
      ref.current.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messageCount, ref, isUserScrolling, isAtBottom])

  const jumpToBottom = () => {
    if (ref.current) {
      ref.current.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
      setIsUserScrolling(false)
      setIsAtBottom(true)
    }
  }

  return { showJumpToBottom, jumpToBottom }
}
