import React from 'react'
import { Moon, Sun, Plus, HelpCircle } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useChatStore } from '@/stores/useChatStore'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip'

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }> = ({ label, children, ...props }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
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
        <img src="/logo.png" alt="لوگوی کندو" className="w-8 h-8" />
        <h1 className="text-lg font-semibold text-text-default hidden sm:block">چت‌بات کندو</h1>
      </div>
      <div className="flex items-center gap-2">
        <IconButton label="گفتگوی جدید" onClick={startNewSession}>
          <Plus size={20} />
        </IconButton>
        <IconButton label={theme === 'light' ? 'فعال‌سازی حالت تاریک' : 'فعال‌سازی حالت روشن'} onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </IconButton>
        <IconButton label="راهنما">
          <HelpCircle size={20} />
        </IconButton>
      </div>
    </header>
  )
}
