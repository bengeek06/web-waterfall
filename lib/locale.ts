import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

// ==================== TYPES ====================
interface JWTPayload {
  user_id: string;
  company_id: string;
  exp: number;
}

// ==================== HELPERS ====================
/**
 * Get the current user ID from JWT cookie
 * @returns user_id string or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.user_id || null;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Get the current company ID from JWT cookie
 * @returns company_id string or null if not authenticated
 */
export async function getCompanyId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.company_id || null;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Get user's preferred language from identity service
 * Fallback to browser locale if user not authenticated or API fails
 * @returns locale string ('en' or 'fr')
 */
export async function getUserLanguage(): Promise<'en' | 'fr'> {
  const userId = await getUserId();
  
  if (!userId) {
    // Not authenticated, return default locale
    return 'fr';
  }
  
  try {
    const response = await fetch(`${process.env.IDENTITY_API_URL || 'http://localhost:5002'}/users/${userId}`, {
      headers: {
        'Cookie': `token=${(await cookies()).get('token')?.value || ''}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch user language:', response.statusText);
      return 'fr';
    }
    
    const user = await response.json();
    return user.language || 'fr';
  } catch (error) {
    console.error('Error fetching user language:', error);
    return 'fr';
  }
}

/**
 * Update user's language preference in identity service
 * @param language - The language to set ('en' or 'fr')
 * @returns true if successful, false otherwise
 */
export async function updateUserLanguage(language: 'en' | 'fr'): Promise<boolean> {
  const userId = await getUserId();
  
  if (!userId) {
    console.error('Cannot update language: user not authenticated');
    return false;
  }
  
  try {
    const response = await fetch(`${process.env.IDENTITY_API_URL || 'http://localhost:5002'}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${(await cookies()).get('token')?.value || ''}`,
      },
      body: JSON.stringify({ language }),
    });
    
    if (!response.ok) {
      console.error('Failed to update user language:', response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user language:', error);
    return false;
  }
}
