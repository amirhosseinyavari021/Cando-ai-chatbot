import React from 'react'
import ChatPage from './pages/ChatPage'
import { useTheme } from './hooks/useTheme'

export default function App() {
  useTheme()
  return (
    <div dir="rtl" className="font-sans">
      <ChatPage />
    </div>
  )
}
