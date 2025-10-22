// Mock for next-intl client
import { jest } from '@jest/globals';

export const useLocale = jest.fn(() => 'fr');

export const useTranslations = jest.fn(() => {
  return (key: string) => {
    const mockMessages: Record<string, string> = {
      welcome: 'Bienvenue sur Waterfall',
      profile: 'Votre profil',
      users: 'Utilisateurs',
      manage_users: 'Gérer les utilisateurs',
      roles: 'Rôles',
      manage_roles: 'Gérer les rôles',
    };
    
    const keys = key.split('.');
    let value: unknown = mockMessages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };
});

export const NextIntlClientProvider = ({ children }: { children: React.ReactNode }) => children;

export const useMessages = jest.fn(() => ({}));
export const useFormatter = jest.fn();
export const useNow = jest.fn();
export const useTimeZone = jest.fn();
