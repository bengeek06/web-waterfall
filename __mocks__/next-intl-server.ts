// Mock for next-intl/server
const mockMessages = {
  welcome: 'Bienvenue sur Waterfall',
  profile: 'Votre profil',
  users: 'Utilisateurs',
  manage_users: 'Gérer les utilisateurs',
  roles: 'Rôles',
  manage_roles: 'Gérer les rôles',
};

export const getTranslations = jest.fn().mockResolvedValue(
  (key: string) => {
    const keys = key.split('.');
    let value: unknown = mockMessages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  }
);

export const getMessages = jest.fn().mockResolvedValue(mockMessages);
export const getLocale = jest.fn().mockResolvedValue('fr');
export const getFormatter = jest.fn();
export const getNow = jest.fn();
export const getTimeZone = jest.fn();
export const getRequestConfig = jest.fn();
export const setRequestLocale = jest.fn();
