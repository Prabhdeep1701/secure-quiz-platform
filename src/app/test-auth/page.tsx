"use client";
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [error, setError] = useState<string>('');

  const testAnonymousAuth = async () => {
    setStatus('Testing anonymous auth...');
    setError('');
    
    try {
      const result = await signInAnonymously(auth);
      setStatus(`Success! User ID: ${result.user.uid}`);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      setStatus('Test failed');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Auth Test</h1>
      
      <div className="mb-4">
        <button 
          onClick={testAnonymousAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Anonymous Auth
        </button>
      </div>

      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>

      {error && (
        <div className="text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Firebase Config:</h2>
        <div className="text-sm">
          <div>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</div>
          <div>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</div>
          <div>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}</div>
        </div>
      </div>
    </div>
  );
} 