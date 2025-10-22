/**
 * Dictionaries Module - Modular Translation System
 * 
 * Structure:
 * - dictionaries/fr/common.json       - Common translations (welcome, description, etc.)
 * - dictionaries/fr/navigation.json   - Navigation menu items
 * - dictionaries/fr/login.json        - Login page
 * - dictionaries/fr/init-app.json     - Init app page
 * - dictionaries/fr/admin-users.json  - Admin users page
 * - ... (add more as needed)
 * 
 * Same structure for /en/
 * 
 * Benefits:
 * - Easy to maintain: each feature has its own file
 * - Easy to find: navigation translations are in navigation.json
 * - Easy to scale: add new files without bloating a single file
 * - Clear ownership: each team/feature can own their translations
 * 
 * Usage:
 * const userLanguage = await getUserLanguage();
 * const dictionary = await getDictionary(userLanguage);
 * 
 * // Access common translations
 * console.log(dictionary.welcome);
 * 
 * // Access feature-specific translations
 * console.log(dictionary.login_component.email);
 * console.log(dictionary.admin_users.page_title);
 */

import 'server-only'

import common_fr from '../dictionaries/fr/common.json';
import navigation_fr from '../dictionaries/fr/navigation.json';
import login_fr from '../dictionaries/fr/login.json';
import initApp_fr from '../dictionaries/fr/init-app.json';
import adminUsers_fr from '../dictionaries/fr/admin-users.json';

import common_en from '../dictionaries/en/common.json';
import navigation_en from '../dictionaries/en/navigation.json';
import login_en from '../dictionaries/en/login.json';
import initApp_en from '../dictionaries/en/init-app.json';
import adminUsers_en from '../dictionaries/en/admin-users.json';

export type Locale = 'fr' | 'en';

// Merged dictionaries
const dictionaries = {
  fr: {
    ...common_fr,
    login_component: login_fr,
    init_app: initApp_fr,
    ...navigation_fr,
    admin_users: adminUsers_fr,
  },
  en: {
    ...common_en,
    login_component: login_en,
    init_app: initApp_en,
    ...navigation_en,
    admin_users: adminUsers_en,
  },
} as const;

export type Dictionary = typeof dictionaries.fr;

/**
 * Get dictionary for a specific locale
 * @param locale - 'fr' or 'en'
 * @returns Merged dictionary with all translations
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale] || dictionaries.fr;
};

/**
 * Type-safe translation keys
 * Use this for autocomplete in your IDE
 */
export type TranslationKey = keyof Dictionary;

/**
 * Helper to get a specific translation
 * @param locale - 'fr' or 'en'
 * @param key - Translation key
 * @returns Translation value
 */
export const getTranslation = async (locale: Locale, key: TranslationKey): Promise<string> => {
  const dict = await getDictionary(locale);
  return dict[key] as string;
};