"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { locales, type Locale } from '@/i18n';

// ==================== TYPES ====================
const LANGUAGE_LABELS: Record<Locale, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
};

// ==================== COMPONENT ====================
export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === locale || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Only persist to database if on authenticated route (welcome/*)
      const isAuthenticatedRoute = pathname.includes('/welcome');
      
      if (isAuthenticatedRoute) {
        // Update language preference in database via API route
        const response = await fetch('/api/user/language', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLocale }),
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.error('Failed to update language preference');
          // Continue with UI update even if API fails
        }
      }
      
      // Remove current locale from pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      
      // Navigate to new locale
      if (newLocale === 'fr') {
        // Default locale, no prefix needed
        router.push(pathWithoutLocale || '/');
      } else {
        router.push(`/${newLocale}${pathWithoutLocale || ''}`);
      }
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
          <span>{LANGUAGE_LABELS[locale].flag}</span>
          <span className="hidden sm:inline">{LANGUAGE_LABELS[locale].name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="gap-2 cursor-pointer"
            disabled={isUpdating}
          >
            <span>{LANGUAGE_LABELS[loc].flag}</span>
            <span>{LANGUAGE_LABELS[loc].name}</span>
            {loc === locale && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
