"use client";
import { useState } from 'react';
import { useAuth } from '@/components/ui/AuthContext';
import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';

export default function TestAuthFlowPage() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [error, setError] = useState<string>('');
  const [steps, setSteps] = useState<string[]>([]);
  const { user, signUpWithEmail } = useAuth();

  const addStep = (step: string) => {
    setSteps(prev => [...prev, step]);
  };

  const clearSteps = () => {
    setSteps([]);
    setStatus('Ready to test');
    setError('');
  };

  const testAuthFlow = async () => {
    clearSteps();
    setStatus('Testing authentication flow...');
    
    try {
      // Step 1: Check if user is authenticated
      if (!user) {
        addStep('❌ No user authenticated');
        setError('Please sign in first');
        setStatus('Test failed');
        return;
      }
      addStep('✅ User authenticated');
      addStep(`User UID: ${user.uid}`);
      addStep(`User Email: ${user.email}`);

      // Step 2: Get ID token
      try {
        const token = await getIdToken(user);
        addStep(`✅ ID token generated (length: ${token.length})`);
        
        // Step 3: Test token validation
        const tokenResponse = await fetch('/api/debug/auth-token', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          addStep('✅ Token validation successful');
          addStep(`Token user: ${tokenData.user?.uid}`);
        } else {
          const tokenError = await tokenResponse.json();
          addStep(`❌ Token validation failed: ${tokenError.message}`);
          setError(`Token validation failed: ${tokenError.message}`);
          setStatus('Test failed');
          return;
        }

        // Step 4: Test user role endpoint
        const roleResponse = await fetch('/api/auth/user-role', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          addStep('✅ User role retrieved successfully');
          addStep(`User role: ${roleData.role}`);
          setStatus('✅ All tests passed!');
        } else if (roleResponse.status === 404) {
          addStep('⚠️ User not found in database (404)');
          addStep('This is expected for new users');
          setStatus('✅ Flow working correctly');
        } else {
          const roleError = await roleResponse.json();
          addStep(`❌ User role failed: ${roleResponse.status} - ${roleError.error}`);
          setError(`User role failed: ${roleError.error}`);
          setStatus('Test failed');
        }

      } catch (tokenError: any) {
        addStep(`❌ Token generation failed: ${tokenError.message}`);
        setError(`Token generation failed: ${tokenError.message}`);
        setStatus('Test failed');
      }

    } catch (error: any) {
      addStep(`❌ Test error: ${error.message}`);
      setError(`Test error: ${error.message}`);
      setStatus('Test failed');
    }
  };

  const testRegistration = async () => {
    clearSteps();
    setStatus('Testing registration...');
    
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'password123';
      const testName = 'Test User';
      
      addStep(`Creating test user: ${testEmail}`);
      
      await signUpWithEmail(testEmail, testPassword, testName, 'Student');
      
      addStep('✅ Registration successful');
      addStep('User should now be in both Firebase Auth and Firestore');
      setStatus('✅ Registration test passed!');
      
    } catch (error: any) {
      addStep(`❌ Registration failed: ${error.message}`);
      setError(`Registration failed: ${error.message}`);
      setStatus('Test failed');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Flow Test</h1>
      
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-bold text-blue-800 mb-2">Status:</h2>
          <p className="text-blue-700">{status}</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h2 className="font-bold text-gray-800 mb-2">Current User:</h2>
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
          onClick={testAuthFlow}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Auth Flow
        </button>
        <button 
          onClick={testRegistration}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Registration
        </button>
        <button 
          onClick={clearSteps}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {steps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Test Steps:</h2>
          <div className="bg-gray-50 border rounded p-4">
            {steps.map((step, index) => (
              <div key={index} className="text-sm mb-2">
                <span className="font-mono text-gray-600">{index + 1}.</span> {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 