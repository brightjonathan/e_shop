"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { AiOutlineMail } from 'react-icons/ai';
import { ResetPassword } from "@/lib/Actions/UserAuth.action";
import { resetPasswordSchema } from "@/components/SchemeIndex";
import { useFormik } from "formik";
import AuthRedirect from "@/components/AuthRedirect";

const Page = () => {
  const [loadingState, setLoadingState] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (
    { email }: { email: string },
    actions: { resetForm: () => void }
  ) => {
    setLoadingState(true);
    try {
      await ResetPassword(email);
      toast.success("Password reset email sent! Check your inbox.");
      setSent(true);
    } catch (error) {
      toast.error("Failed to send reset email. Check the email address.");
      console.log(error);
    } finally {
      setLoadingState(false);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      actions.resetForm();
    }
  };

  const { values, handleBlur, touched, errors, handleChange, handleSubmit, isSubmitting } = useFormik({
    initialValues: { email: "" },
    validationSchema: resetPasswordSchema,
    onSubmit,
  });

  return (
    <AuthRedirect>
      {/* ── PAGE: RESET PASSWORD ── centered minimal card, white background */}
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">

        {/* Subtle top gradient strip */}
        <div className="pointer-events-none fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-green-700 via-green-400 to-green-700" />

        {/* Faint background pattern */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle, #166534 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative w-full max-w-sm">

          {/* Lock icon badge */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-green-900 flex items-center justify-center shadow-xl shadow-green-900/25">
              <svg
                className="w-7 h-7 text-green-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-green-600 mb-1">
              Account recovery
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reset your password
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Enter your email address and we&apos;ll send you a link to get back into your account.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/80 px-7 py-8">

            {/* Success state */}
            {sent && (
              <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3.5">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Email sent!</p>
                  <p className="text-xs text-green-700/70 mt-0.5 leading-relaxed">
                    Check your inbox — a reset link is on its way. It may take a minute or two.
                  </p>
                </div>
              </div>
            )}

            <form autoComplete="off" onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label className="block text-[11px] font-semibold tracking-widest uppercase text-gray-500 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 pr-10 rounded-xl border text-gray-800 placeholder-gray-300 text-sm outline-none transition-all bg-gray-50
                      focus:bg-white focus:ring-2 focus:ring-green-400/30 focus:border-green-500
                      ${touched.email && errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  <AiOutlineMail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-base pointer-events-none" />
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <p className="text-center text-xs text-gray-400 mb-4">
                By continuing you accept our{' '}
                <span className="underline cursor-pointer text-gray-500">Terms</span>{' '}
                and{' '}
                <span className="underline cursor-pointer text-gray-500">Privacy Policy</span>
              </p>

              <button
                type="submit"
                disabled={isSubmitting || loadingState}
                className="w-full py-3 rounded-xl bg-green-900 text-white text-sm font-semibold tracking-wide
                  hover:bg-green-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-green-900/20"
              >
                {loadingState ? "Sending…" : "Send reset link"}
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <Link href="/signin" className="hover:text-green-700 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to sign in
              </Link>
              <Link href="/signup" className="hover:text-green-700 transition-colors underline underline-offset-2">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
};

export default Page;








