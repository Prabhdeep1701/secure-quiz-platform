"use client";
import { useState } from 'react';
import { useAuth } from '@/components/ui/AuthContext';

interface TokenInfo {
  length?: number;
  start?: string;
  end?: string;
  validation?: any;
  userRole?: any;
}

export default function DebugTokenPage() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [error, setError] = useState<string>('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const { user, getIdToken } = useAuth();

  const testTokenGeneration = async () => {
    setStatus('Testing token generation...');
    setError('');
    
    if (!user) {
      setError('No user logged in');
      setStatus('Test failed');
      return;
    }

    try {
      const token = await getIdToken();
      if (!token) {
        setError('Failed to get ID token');
        setStatus('Test failed');
        return;
      }

      setTokenInfo({
        length: token.length,
        start: token.substring(0, 20) + '...',
        end: '...' + token.substring(token.length - 20)
      });

      // Test the token with our debug endpoint
      const response = await fetch('/api/debug/auth-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus('✅ Token validation successful');
        setTokenInfo((prev: TokenInfo | null) => ({ ...prev, validation: data }));
      } else {
        setError(`❌ Token validation failed: ${data.message}`);
        setStatus('Test completed');
        setTokenInfo((prev: TokenInfo | null) => ({ ...prev, validation: data }));
      }
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
      setStatus('Test failed');
    }
  };

  const testUserRole = async () => {
    setStatus('Testing user role endpoint...');
    setError('');
    
    if (!user) {
      setError('No user logged in');
      setStatus('Test failed');
      return;
    }

    try {
      const token = await getIdToken();
      const response = await fetch('/api/auth/user-role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus('✅ User role endpoint successful');
        setTokenInfo((prev: TokenInfo | null) => ({ ...prev, userRole: data }));
      } else {
        setError(`❌ User role endpoint failed: ${response.status} - ${data.error || data.message}`);
        setStatus('Test completed');
        setTokenInfo((prev: TokenInfo | null) => ({ ...prev, userRole: data }));
      }
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
      setStatus('Test failed');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Token Debug</h1>
      
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-bold text-blue-800 mb-2">Current Status:</h2>
          <p className="text-blue-700">{status}</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h2 className="font-bold text-gray-800 mb-2">User Info:</h2>
          {user ? (
            <div className="text-sm">
              <div>UID: {user.uid}</div>
              <div>Email: {user.email}</div>
              <div>Email Verified: {user.emailVerified ? 'Yes' : 'No'}</div>
            </div>
          ) : (
            <p className="text-gray-600">No user logged in</p>
          )}
        </div>
      </div>

      <div className="mb-6 space-x-4">
        <button 
          onClick={testTokenGeneration}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Token Generation
        </button>
        <button 
          onClick={testUserRole}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test User Role Endpoint
        </button>
      </div>

      {tokenInfo && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Token Information:</h2>
          <div className="p-4 bg-gray-50 border rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 