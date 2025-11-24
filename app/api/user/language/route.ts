import { NextRequest, NextResponse } from 'next/server';
import { updateUserLanguage } from '@/lib/utils/locale';

/**
 * PATCH /api/user/language
 * Update the current user's language preference
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { language } = body;
    
    if (!language || !['en', 'fr'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be "en" or "fr"' },
        { status: 400 }
      );
    }
    
    const success = await updateUserLanguage(language);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update language preference' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, language });
  } catch (error) {
    console.error('Error in PATCH /api/user/language:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
