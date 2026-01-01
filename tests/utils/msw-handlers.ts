/**
 * MSW (Mock Service Worker) request handlers
 * 
 * NOTE: This is OPTIONAL and only needed if there are actual fetch() calls
 * to external APIs. Most task flows use Supabase client directly, not fetch.
 * 
 * Primary mocking should use Supabase client mocks (mock-supabase.ts), not MSW.
 * Only use MSW if there are actual fetch() calls to external APIs.
 */

import { http, HttpResponse } from 'msw'

// Example handlers (uncomment and modify if needed)
/*
export const handlers = [
  // Example: Mock an external API
  http.get('https://api.example.com/data', () => {
    return HttpResponse.json({ data: 'mock data' })
  }),
]
*/

// For now, return empty handlers since we use Supabase client mocking
export const handlers: any[] = []
