import React, { useEffect } from 'react'
import { Header } from '@/components/Header'
import { MessageList } from '@/components/MessageList'
import { Composer } from '@/components/Composer'
import { HeroChips } from '@/components/HeroChips'
import { useChatStore } from '@/stores/useChatStore'

const ChatPage: React.FC = () => {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const sendMessage = useChatStore((s) => s.sendMessage)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.getElementById('chat-composer')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleChipClick = (t: string) => sendMessage(t)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {messages.length === 0 && !isLoading ? <HeroChips onChipClick={handleChipClick} /> : <MessageList />}
      </main>
      <Composer />
    </div>
  )
}

export default ChatPage
