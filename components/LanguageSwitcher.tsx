"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

// ==================== TYPES ====================
type Locale = 'fr' | 'en';

const LANGUAGE_LABELS: Record<Locale, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
};

const LOCALES: Locale[] = ['fr', 'en'];

// ==================== COMPONENT ====================
export default function LanguageSwitcher() {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>('fr');

  // Get current locale from localStorage or default to 'fr'
  useEffect(() => {
    const storedLocale = localStorage.getItem('userLanguage') as Locale;
    if (storedLocale && LOCALES.includes(storedLocale)) {
      setCurrentLocale(storedLocale);
    }
  }, []);

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === currentLocale || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Update language preference in database via API route
      const response = await fetchWithAuth('/api/user/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLocale }),
      });
      
      if (!response.ok) {
        console.error('Failed to update language preference');
        // Continue with UI update even if API fails
      }
      
      // Update localStorage for client-side persistence
      localStorage.setItem('userLanguage', newLocale);
      setCurrentLocale(newLocale);
      
      // Refresh page to reload with new language
      router.refresh();
    } catch (error) {
      console.error('Error switching language:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isUpdating}>
          <Globe className="h-4 w-4" />
          <span>{LANGUAGE_LABELS[currentLocale].flag}</span>
          <span className="hidden sm:inline">{LANGUAGE_LABELS[currentLocale].name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="gap-2 cursor-pointer"
            disabled={isUpdating}
          >
            <span>{LANGUAGE_LABELS[loc].flag}</span>
            <span>{LANGUAGE_LABELS[loc].name}</span>
            {loc === currentLocale && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
