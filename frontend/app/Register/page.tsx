"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoImg from "../logo/logo242.png";
import { authAPI } from "@/api";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);
      await authAPI.register({
        username: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      alert("Account created successfully. Please log in.");
      router.push("/login");
    } catch (submitError) {
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
    <div className="relative flex min-h-screen items-center justify-center bg-[#EFEFEF] p-6 font-sans">
      <div className="absolute left-8 top-8 cursor-pointer transition-opacity hover:opacity-70">
        <div className="flex flex-col gap-1.5">
          <Link href="/login" className="transition-opacity hover:opacity-80">
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

      <div className="w-full max-w-[700px] rounded-[32px] border border-gray-100 bg-white p-12 shadow-sm md:p-16">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-medium text-gray-900">
            Create an account
          </h1>
          <p className="text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-gray-900 underline">
              Log in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <label className="ml-1 text-lg text-gray-600">
              What should we call you?
            </label>
            <input
              type="text"
              placeholder="Enter your profile name"
              className="w-full rounded-xl border border-gray-200 px-5 py-4 text-gray-900 transition-all placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-lg text-gray-600">
              What&apos;s your email?
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full rounded-xl border border-gray-200 px-5 py-4 text-gray-900 transition-all placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-lg text-gray-600">Create a password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                <span className="text-sm">{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-gray-200 px-5 py-4 text-gray-900 transition-all placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <p className="ml-1 text-xs text-gray-400">
              Use 8 or more characters with a mix of letters, numbers &
              symbols
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-[400px] rounded-full bg-[#D1E6FF] py-4 text-xl font-semibold text-[#4A90E2] shadow-sm transition-all hover:bg-[#B8D7FF] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating account..." : "Create an account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
