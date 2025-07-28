"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ui/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Teacher" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, user, userRole } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && userRole) {
      if (userRole === "Teacher") {
        router.push("/dashboard/teacher");
      } else if (userRole === "Student") {
        router.push("/dashboard/student");
      } else {
        router.push("/");
      }
    }
  }, [user, userRole, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await signUpWithEmail(form.email, form.password, form.name, form.role);
      setSuccess("Registration successful! Redirecting...");
      // Redirect will be handled by useEffect
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await signInWithGoogle();
      setSuccess("Registration successful! Redirecting...");
      // Redirect will be handled by useEffect
    } catch (err: any) {
      setError(err.message || "Google registration failed");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-stone-50 to-teal-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center">
        {/* Accent Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-purple-200 via-teal-200 to-amber-100 rounded-full flex items-center justify-center mb-6 shadow-sm backdrop-blur-sm">
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-center text-stone-800">Register</h1>
        {error && <div className="text-red-600 text-sm text-center mb-2">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center mb-2">{success}</div>}
        <form onSubmit={handleEmailSubmit} className="space-y-4 w-full">
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-700">Name</label>
            <input 
              name="name" 
              type="text" 
              required 
              value={form.name} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-300" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-700">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              value={form.email} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-300" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-700">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              value={form.password} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-300" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-700">Role</label>
            <select 
              name="role" 
              value={form.role} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-purple-500 text-white py-2 rounded font-semibold hover:bg-purple-600 transition disabled:opacity-50 shadow"
          >
            {loading ? "Registering..." : "Register with Email"}
          </button>
        </form>
        <div className="relative w-full my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-stone-400">Or continue with</span>
          </div>
        </div>
        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-teal-300 text-teal-700 py-2 rounded hover:bg-teal-50 transition disabled:opacity-50 flex items-center justify-center space-x-2 mb-2 shadow"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Register with Google</span>
        </button>
        <div className="text-sm text-center mt-4">
          Already have an account? <a href="/auth/signin" className="text-purple-600 hover:underline">Sign in</a>
        </div>
      </div>
    </main>
  );
} 