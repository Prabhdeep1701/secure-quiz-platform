"use client";
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';

interface TestResults {
  [key: string]: string;
}

export default function VerifyAuthPage() {
  const [status, setStatus] = useState<string>('Checking Firebase Auth...');
  const [error, setError] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResults>({});

  useEffect(() => {
    checkFirebaseAuth();
  }, []);

  const checkFirebaseAuth = async () => {
    setStatus('Testing Firebase Auth configuration...');
    setError('');
    
    try {
      // Test 1: Check if auth object is properly initialized
      if (!auth) {
        throw new Error('Firebase Auth object is not initialized');
      }
      
      setTestResults((prev: TestResults) => ({ ...prev, authObject: '✅ Auth object initialized' }));
      
      // Test 2: Try anonymous sign-in (this will fail if Auth is not enabled)
      try {
        const result = await signInAnonymously(auth);
        setTestResults((prev: TestResults) => ({ 
          ...prev, 
          anonymousAuth: `✅ Anonymous auth works - User ID: ${result.user.uid}` 
        }));
        
        // Sign out after test
        await auth.signOut();
      } catch (anonError: any) {
        setTestResults((prev: TestResults) => ({ 
          ...prev, 
          anonymousAuth: `❌ Anonymous auth failed: ${anonError.code}` 
        }));
      }
      
      setStatus('Firebase Auth configuration check completed');
      
    } catch (err: any) {
      setError(`Configuration Error: ${err.message}`);
      setStatus('Firebase Auth configuration failed');
    }
  };

  const testEmailAuth = async () => {
    setStatus('Testing Email/Password authentication...');
    
    try {
      // This will fail if Email/Password auth is not enabled
      await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setTestResults((prev: TestResults) => ({ 
          ...prev, 
          emailAuth: '✅ Email/Password auth is enabled (expected error for invalid credentials)' 
        }));
      } else if (err.code === 'auth/configuration-not-found') {
        setTestResults((prev: TestResults) => ({ 
          ...prev, 
          emailAuth: '❌ Email/Password auth is NOT enabled' 
        }));
      } else {
        setTestResults((prev: TestResults) => ({ 
          ...prev, 
          emailAuth: `❌ Email/Password auth error: ${err.code}` 
        }));
      }
    }
    
    setStatus('Email/Password test completed');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Firebase Auth Verification</h1>
      
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <h2 className="font-bold text-blue-800 mb-2">Current Status:</h2>
          <p className="text-blue-700">{status}</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      <div className="mb-6">
        <button 
          onClick={checkFirebaseAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
        >
          Re-run Auth Check
        </button>
        <button 
          onClick={testEmailAuth}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Email/Password Auth
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Test Results:</h2>
        {Object.entries(testResults).map(([test, result]) => (
          <div key={test} className="p-3 border rounded">
            <strong>{test}:</strong> {result}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="font-bold text-yellow-800 mb-2">If Tests Fail:</h2>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a></li>
          <li>Select your project: <strong>lemma-quiz-platform</strong></li>
          <li>Click <strong>"Authentication"</strong> in the left sidebar</li>
          <li>Click <strong>"Get started"</strong> if Authentication is not enabled</li>
          <li>Go to <strong>"Sign-in method"</strong> tab</li>
          <li>Enable <strong>"Email/Password"</strong> and <strong>"Google"</strong></li>
          <li>Click <strong>"Save"</strong> for each method</li>
        </ol>
      </div>
    </div>
  );
} 