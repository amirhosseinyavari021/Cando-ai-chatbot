import React from 'react';
import { Menu, Plus } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';

const Header = ({ onToggleSidebar }) => {
  const { t } = useTranslation();

  return (
    <header className="flex-shrink-0 flex items-center justify-between h-16 px-4 md:px-6 border-b border-border">
      {/* Right Side (in RTL) */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="d-inline-flex md:hidden" // Only show on mobile
          onClick={onToggleSidebar}
          aria-label={t('toggleSidebar')}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.location.reload()} // Simple "new chat"
        >
          <Plus className="w-4 h-4" />
          {t('newChat')}
        </Button>
      </div>

      {/* Left Side (in RTL) */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {/* You can add User Avatar or other items here */}
      </div>
    </header>
  );
};

export default Header;