import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'default' | 'sidebar';
  className?: string;
}

export const ThemeToggle = ({ variant = 'default', className }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  
  return (
    <Toggle 
      pressed={theme === 'dark'} 
      onPressedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        "h-9 w-9",
        variant === 'sidebar' && "text-sidebar-foreground hover:bg-sidebar-accent/10 bg-transparent border-sidebar-border/20",
        className
      )} 
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Toggle>
  );
};
