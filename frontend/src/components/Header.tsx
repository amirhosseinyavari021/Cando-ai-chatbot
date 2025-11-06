import React from 'react'
import { Moon, Sun, Plus, HelpCircle } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useChatStore } from '@/stores/useChatStore'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip'

// This component was already defined locally in the file
const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }> = ({ label, children, ...props }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          className="p-2 rounded-full text-text-muted hover:text-text-default hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-colors"
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const startNewSession = useChatStore((s) => s.startNewSession)

  return (
    <header className="sticky top-0 z-10 flex items-center h-16 px-4 sm:px-6 md:px-8 border-b border-border-subtle bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 me-auto">
        <img src="/logo.png" alt="Cando Logo" className="w-8 h-8" />
        {/* Translated title */}
        <h1 className="text-lg font-semibold text-text-default hidden sm:block">Cando Chatbot</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Translated labels */}
        <IconButton label="New Chat" onClick={startNewSession}>
          <Plus size={20} />
        </IconButton>
        <IconButton label={theme === 'light' ? 'Enable Dark Mode' : 'Enable Light Mode'} onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </IconButton>
        <IconButton label="Help">
          <HelpCircle size={20} />
        </IconButton>
      </div>
    </header>
  )
}