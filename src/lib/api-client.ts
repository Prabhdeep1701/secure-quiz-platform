import { auth } from './firebase';

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
} 