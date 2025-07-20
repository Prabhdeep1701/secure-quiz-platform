"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui/AuthContext';
import { getIdToken } from 'firebase/auth';

export default function DebugRolePage() {
  const { user, userRole, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkUserRole = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const info: any = {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      },
      contextRole: userRole,
      timestamp: new Date().toISOString()
    };

    try {
      // Get fresh token
      const token = await getIdToken(user, true); // Force refresh
      info.tokenLength = token.length;

      // Check user role from API
      const response = await fetch('/api/auth/user-role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      info.apiResponse = {
        status: response.status,
        ok: response.ok
      };

      if (response.ok) {
        const data = await response.json();
        info.apiRole = data.role;
        info.apiData = data;
      } else {
        const errorData = await response.json().catch(() => ({}));
        info.apiError = errorData;
      }

      // Check Firestore directly
      const firestoreResponse = await fetch('/api/debug/firestore-user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (firestoreResponse.ok) {
        const firestoreData = await firestoreResponse.json();
        info.firestoreData = firestoreData;
      } else {
        const firestoreError = await firestoreResponse.json().catch(() => ({}));
        info.firestoreError = firestoreError;
      }

    } catch (error: any) {
      info.error = error.message;
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const forceRefreshRole = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Force token refresh
      const token = await getIdToken(user, true);
      
      // Try to get user role again
      const response = await fetch('/api/auth/user-role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fresh role data:', data);
        // Force a page reload to update the context
        window.location.reload();
      } else {
        console.error('Failed to get fresh role:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing role:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && !loading) {
      checkUserRole();
    }
  }, [user, loading]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Role Debug Information</h1>
      
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-bold text-blue-800 mb-2">Current State:</h2>
          <div className="text-sm space-y-1">
            <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Context Role: <span className="font-mono">{userRole || 'null'}</span></div>
            {user && (
              <div>User UID: <span className="font-mono">{user.uid}</span></div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 space-x-4">
        <button 
          onClick={checkUserRole}
          disabled={isLoading || !user}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Check Role'}
        </button>
        <button 
          onClick={forceRefreshRole}
          disabled={isLoading || !user}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Force Refresh Role'}
        </button>
      </div>

      {Object.keys(debugInfo).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Debug Information:</h2>
          <div className="bg-gray-50 border rounded p-4">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">
            Please sign in to see debug information.
          </p>
        </div>
      )}
    </div>
  );
} 