/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

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

import common_fr from '../../dictionaries/fr/common.json';
import navigation_fr from '../../dictionaries/fr/navigation.json';
import login_fr from '../../dictionaries/fr/login.json';
import initApp_fr from '../../dictionaries/fr/init-app.json';
import adminUsers_fr from '../../dictionaries/fr/admin-users.json';
import admin_fr from '../../dictionaries/fr/admin.json';
import welcome_fr from '../../dictionaries/fr/welcome.json';
import profile_fr from '../../dictionaries/fr/profile.json';
import roles_fr from '../../dictionaries/fr/roles.json';
import policies_fr from '../../dictionaries/fr/policies.json';
import company_fr from '../../dictionaries/fr/company.json';
import organization_fr from '../../dictionaries/fr/organization.json';
import workspace_fr from '../../dictionaries/fr/workspace.json';
import errors_fr from '../../dictionaries/fr/errors.json';

import common_en from '../../dictionaries/en/common.json';
import navigation_en from '../../dictionaries/en/navigation.json';
import login_en from '../../dictionaries/en/login.json';
import initApp_en from '../../dictionaries/en/init-app.json';
import adminUsers_en from '../../dictionaries/en/admin-users.json';
import admin_en from '../../dictionaries/en/admin.json';
import welcome_en from '../../dictionaries/en/welcome.json';
import profile_en from '../../dictionaries/en/profile.json';
import roles_en from '../../dictionaries/en/roles.json';
import policies_en from '../../dictionaries/en/policies.json';
import company_en from '../../dictionaries/en/company.json';
import organization_en from '../../dictionaries/en/organization.json';
import workspace_en from '../../dictionaries/en/workspace.json';
import errors_en from '../../dictionaries/en/errors.json';

export type Locale = 'fr' | 'en';

// Merged dictionaries
const dictionaries = {
  fr: {
    ...common_fr,
    login_component: login_fr,
    init_app: initApp_fr,
    ...navigation_fr,
    admin_users: adminUsers_fr,
    admin_page: admin_fr,
    welcome_page: welcome_fr,
    ...profile_fr,
    roles: roles_fr,
    policies: policies_fr,
    company: company_fr,
    organization: organization_fr,
    workspace: workspace_fr,
    errors: errors_fr,
  },
  en: {
    ...common_en,
    login_component: login_en,
    init_app: initApp_en,
    ...navigation_en,
    admin_users: adminUsers_en,
    admin_page: admin_en,
    welcome_page: welcome_en,
    ...profile_en,
    roles: roles_en,
    policies: policies_en,
    company: company_en,
    organization: organization_en,
    workspace: workspace_en,
    errors: errors_en,
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