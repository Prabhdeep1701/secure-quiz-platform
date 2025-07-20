"use client";
import { useState } from 'react';
import { useAuth } from '@/components/ui/AuthContext';

export default function TestRegistrationPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Student" });
  const [status, setStatus] = useState<string>('Ready to test');
  const [error, setError] = useState<string>('');
  const { signUpWithEmail } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTestRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Testing registration...');
    setError('');
    
    try {
      await signUpWithEmail(form.email, form.password, form.name, form.role);
      setStatus('✅ Registration successful!');
    } catch (err: any) {
      setError(`❌ Registration failed: ${err.message}`);
      setStatus('Registration test completed');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Registration</h1>
      
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-bold text-blue-800 mb-2">Status:</h2>
          <p className="text-blue-700">{status}</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      <form onSubmit={handleTestRegistration} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input 
            name="name" 
            type="text" 
            required 
            value={form.name} 
            onChange={handleChange} 
            className="w-full border rounded px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            name="email" 
            type="email" 
            required 
            value={form.email} 
            onChange={handleChange} 
            className="w-full border rounded px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            name="password" 
            type="password" 
            required 
            value={form.password} 
            onChange={handleChange} 
            className="w-full border rounded px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select 
            name="role" 
            value={form.role} 
            onChange={handleChange} 
            className="w-full border rounded px-3 py-2"
          >
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </select>
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Test Registration
        </button>
      </form>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="font-bold text-yellow-800 mb-2">What this tests:</h2>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>Firebase Auth user creation</li>
          <li>Server-side user document creation</li>
          <li>Permission handling</li>
          <li>Role assignment</li>
        </ul>
      </div>
    </div>
  );
} 