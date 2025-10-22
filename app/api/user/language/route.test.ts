/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from './route';
import { updateUserLanguage } from '@/lib/locale';

// Mock the locale module
jest.mock('@/lib/locale', () => ({
  updateUserLanguage: jest.fn(),
}));

describe('PATCH /api/user/language', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update language to "en" successfully', async () => {
    (updateUserLanguage as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/user/language', {
      method: 'PATCH',
      body: JSON.stringify({ language: 'en' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, language: 'en' });
    expect(updateUserLanguage).toHaveBeenCalledWith('en');
  });

  it('should update language to "fr" successfully', async () => {
    (updateUserLanguage as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/user/language', {
      method: 'PATCH',
      body: JSON.stringify({ language: 'fr' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, language: 'fr' });
    expect(updateUserLanguage).toHaveBeenCalledWith('fr');
  });

  it('should return 400 for invalid language', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/language', {
      method: 'PATCH',
      body: JSON.stringify({ language: 'es' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid language. Must be "en" or "fr"' });
    expect(updateUserLanguage).not.toHaveBeenCalled();
  });

  it('should return 400 for missing language', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/language', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid language. Must be "en" or "fr"' });
    expect(updateUserLanguage).not.toHaveBeenCalled();
  });

  it('should return 500 if update fails', async () => {
    (updateUserLanguage as jest.Mock).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/user/language', {
      method: 'PATCH',
      body: JSON.stringify({ language: 'en' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to update language preference' });
    expect(updateUserLanguage).toHaveBeenCalledWith('en');
  });

  it('should return 500 on exception', async () => {
    (updateUserLanguage as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/user/language', {
      method: 'PATCH',
      body: JSON.stringify({ language: 'en' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
