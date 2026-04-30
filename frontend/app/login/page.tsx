"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react'; 
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import logoImg from "../logo/logo242.png";
import { authAPI } from "@/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      const response = await authAPI.login({
        email: email.trim(),
        password,
      });

      window.localStorage.setItem("userId", String(response.user.id));
      window.localStorage.setItem("username", response.user.username);
      console.log("Login successful");
      router.push("/dashboard");
    } catch (submitError) {
      console.error("Login failed:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to login. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Logo Section */}
      <div className="mb-8">
        <Image
            src={logoImg}
            alt="logo"
            width={50}
            height={50}
            priority
          />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 md:p-14">
        <h1 className="text-3xl font-medium text-center text-gray-800 mb-10">Sign in</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
              {error}
            </p>
          )}
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-500 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm text-gray-500">Your password</label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-sm text-gray-400 flex items-center gap-1 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#D1E6FF] hover:bg-[#B8D7FF] text-[#4A90E2] font-semibold rounded-full transition-colors mt-4 text-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Log in"}
          </button>
        </form>

        
      </div>

      {/* Create Account Button */}
      <Link href="/register" className="w-full max-w-md mt-6">
        <button className="w-full py-4 bg-transparent border border-gray-400 text-gray-600 font-medium rounded-full hover:bg-gray-50 transition-colors text-lg">
          Create an account
        </button>
      </Link>
    </div>
  );
}
