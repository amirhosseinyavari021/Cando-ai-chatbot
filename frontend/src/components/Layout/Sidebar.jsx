import React from 'react';
import { MessageSquare, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-10 bg-black/50 transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed md:relative inset-y-0 rtl:right-0 ltr:left-0 z-20',
          'flex flex-col w-72 bg-card border-l border-border', // RTL: border-l
          'transition-transform duration-300 ease-in-out',
          isOpen
            ? 'translate-x-0'
            : 'rtl:translate-x-full ltr:-translate-x-full md:translate-x-0', // Handle RTL/LTR slide
          'md:w-64 md:translate-x-0' // Desktop
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Cando Logo" className="w-8 h-8" />
            <h1 className="text-lg font-semibold">{t('appName')}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="font-medium text-sm text-muted-foreground px-2 py-1">
            {t('history')}
          </div>
          
          {/* Static Example - Replace with dynamic history */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm truncate"
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t('exampleChat1')}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm truncate"
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t('exampleChat2')}</span>
          </Button>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border">
          {/* You can add user profile, settings, etc. here */}
          <div className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Cando
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;