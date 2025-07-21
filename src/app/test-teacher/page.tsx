"use client";
import { useState } from 'react';
import { useAuth } from '@/components/ui/AuthContext';
import { useRouter } from 'next/navigation';
import { getIdToken } from 'firebase/auth';
// import { auth } from '@/lib/firebase';

export default function TestTeacherPage() {
  const { user, userRole, loading, signUpWithEmail } = useAuth();
  const [status, setStatus] = useState('Ready to test');
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testTeacherRegistration = async () => {
    setStatus('Testing teacher registration...');
    setLogs([]);
    
    try {
      const testEmail = `teacher-test-${Date.now()}@example.com`;
      const testPassword = 'password123';
      const testName = 'Test Teacher';
      
      addLog(`Starting registration with email: ${testEmail}`);
      addLog(`Role: Teacher`);
      
      await signUpWithEmail(testEmail, testPassword, testName, 'Teacher');
      
      addLog('Registration completed successfully');
      addLog(`Current user role: ${userRole}`);
      addLog(`User UID: ${user?.uid}`);
      
      // Check what's actually stored in Firestore
      if (user) {
        try {
          const token = await getIdToken(user);
          const firestoreResponse = await fetch('/api/debug/check-user-role', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (firestoreResponse.ok) {
            const firestoreData = await firestoreResponse.json();
            addLog(`Firestore role: ${firestoreData.firestoreRole}`);
            addLog(`Firestore data: ${JSON.stringify(firestoreData.firestoreData)}`);
          } else {
            const errorData = await firestoreResponse.json().catch(() => ({}));
            addLog(`Firestore check failed: ${errorData.error}`);
          }
        } catch (error: any) {
          addLog(`Error checking Firestore: ${error.message}`);
        }
      }
      
      // Wait a moment and check again
      setTimeout(() => {
        addLog(`After delay - User role: ${userRole}`);
        if (userRole === 'Teacher') {
          addLog('✅ Role is Teacher - should redirect to teacher dashboard');
          setStatus('✅ Registration successful - Teacher role detected');
        } else {
          addLog('❌ Role is not Teacher - this is the problem');
          setStatus('❌ Registration failed - Role not set correctly');
        }
      }, 1000);
      
    } catch (error: any) {
      addLog(`❌ Registration error: ${error.message}`);
      setStatus('❌ Registration failed');
    }
  };

  const checkCurrentState = () => {
    addLog('=== Current State Check ===');
    addLog(`User: ${user ? 'Logged in' : 'Not logged in'}`);
    addLog(`User UID: ${user?.uid || 'N/A'}`);
    addLog(`User Email: ${user?.email || 'N/A'}`);
    addLog(`User Role: ${userRole || 'null'}`);
    addLog(`Loading: ${loading}`);
    addLog('========================');
  };

  const forceRedirect = () => {
    if (userRole === 'Teacher') {
      addLog('Forcing redirect to teacher dashboard...');
      router.push('/dashboard/teacher');
    } else {
      addLog('Cannot redirect - role is not Teacher');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Teacher Registration Test</h1>
      
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-bold text-blue-800 mb-2">Status:</h2>
          <p className="text-blue-700">{status}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h2 className="font-bold text-gray-800 mb-2">Current State:</h2>
          <div className="text-sm space-y-1">
            <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
            <div>User Role: <span className="font-mono">{userRole || 'null'}</span></div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            {user && (
              <>
                <div>UID: <span className="font-mono">{user.uid}</span></div>
                <div>Email: {user.email}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 space-x-4">
        <button 
          onClick={testTeacherRegistration}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Teacher Registration
        </button>
        <button 
          onClick={checkCurrentState}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Check Current State
        </button>
        <button 
          onClick={forceRedirect}
          disabled={userRole !== 'Teacher'}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Force Redirect to Teacher Dashboard
        </button>
      </div>

      {logs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Test Logs:</h2>
          <div className="bg-gray-50 border rounded p-4 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Click &quot;Test Teacher Registration&quot; to create a new teacher account</li>
          <li>2. Watch the logs to see what happens during registration</li>
          <li>3. Check if the role is set correctly</li>
          <li>4. If role is correct, try &quot;Force Redirect&quot; button</li>
          <li>5. Share the logs with me to help debug the issue</li>
        </ol>
      </div>
    </div>
  );
} 