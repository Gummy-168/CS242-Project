"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import logoImg from "../logo/logo242.png";
import { authAPI } from "@/api";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await authAPI.register({
        username: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      console.log("Register successful");
      alert("Account created successfully. Please log in.");
      router.push("/login");
    } catch (submitError) {
      console.error("Register failed:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEFEF] relative flex items-center justify-center p-6 font-sans">
      
      {/* Menu Icon  */}
      <div className="absolute top-8 left-8 cursor-pointer hover:opacity-70 transition-opacity">
        <div className="flex flex-col gap-1.5">
           <Link href="/login" className="hover:opacity-80 transition-opacity">
                <Image
                    src={logoImg}
                    alt="logo"
                    width={50}
                    height={50}
                    style={{ width: "auto", height: "auto" }}
                    priority
                />
                </Link>
        </div>

      </div>

      {/* Register Card */}
      <div className="w-full max-w-[700px] bg-white rounded-[32px] shadow-sm border border-gray-100 p-12 md:p-16">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-medium text-gray-900 mb-2">Create an account</h1>
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-gray-900 underline font-medium">Log in</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
              {error}
            </p>
          )}
          
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-gray-600 ml-1 text-lg">What should we call you?</label>
            <input
              type="text"
              placeholder="Enter your profile name"
              className="w-full px-5 py-4 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-gray-600 ml-1 text-lg">What's your email?</label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full px-5 py-4 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-gray-600 text-lg">Create a password</label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 flex items-center gap-2 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                <span className="text-sm">{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="w-full px-5 py-4 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <p className="text-xs text-gray-400 ml-1">
              Use 8 or more characters with a mix of letters, numbers & symbols
            </p>
          </div>

          

          {/* Register Button */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-[400px] py-4 bg-[#D1E6FF] hover:bg-[#B8D7FF] text-[#4A90E2] font-semibold rounded-full transition-all text-xl shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating account..." : "Create an account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
