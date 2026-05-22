"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useFormik, FormikHelpers } from 'formik';
import { useRouter } from "next/navigation";
import { FaRegUser } from 'react-icons/fa';
import { AiFillEyeInvisible, AiFillEye, AiOutlineMail } from 'react-icons/ai';
import GoogleAuth from '@/components/GoogleAuth';
import { BasicSchema } from '@/components/SchemeIndex';
import { registerUser } from '@/lib/Actions/UserAuth.action';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';
import AuthRedirect from '@/components/AuthRedirect';

const Page = () => {

  
  const [loadingState, setLoadingState] = useState(false);
  const router = useRouter();
  const [passwordEye, setPasswordEye] = useState(false);
  const [confirmPasswordEye, setConfirmPasswordEye] = useState(false);

  const onSubmit = async (
    { username, email, password }: { username: string; email: string; password: string; confirmPassword: string },
    actions: FormikHelpers<{ username: string; email: string; password: string; confirmPassword: string }>
  ) => {
    setLoadingState(true);
    try {
      await registerUser(username, email, password);
      toast.success("Account created successfully!");
      router.push("/");
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingState(false);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      actions.resetForm();
    }
  };

  const { values, handleBlur, isSubmitting, touched, errors, handleChange, handleSubmit } = useFormik({
    initialValues: { username: "", email: "", password: "", confirmPassword: "" },
    validationSchema: BasicSchema,
    onSubmit,
  });

  return (
    <AuthRedirect>
      {loadingState && <Loading />}

      {/* ── PAGE: SIGN UP ── dark forest background, two-column card */}
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0d1f0f]">

        {/* Glow accents */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-125 h-125 rounded-full bg-green-900/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-100 h-100 rounded-full bg-green-800/15 blur-3xl" />
        </div>

        <div className="relative w-full max-w-2xl">

          {/* Top accent bar */}
          <div className="h-1 w-full rounded-t-2xl bg-linear-to-r from-green-700 via-green-400 to-green-700" />

          <div className="bg-[#e8edea] rounded-b-2xl rounded-tr-2xl shadow-2xl px-8 py-10 sm:px-12">

            {/* Header */}
            <div className="mb-8">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-green-600 mb-1">
                Get started
              </p>
              <h1 className="text-4xl font-semibold text-green-900 leading-tight">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-green-700/70">
                Fill in the details below to join us today.
              </p>
            </div>

            <form autoComplete="off" onSubmit={handleSubmit} noValidate>

              {/* Row 1 — Username + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">

                {/* Username */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-green-800 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      placeholder="Your username"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-white/70 text-green-900 placeholder-green-400 text-sm outline-none transition-all
                        focus:bg-white focus:ring-2 focus:ring-green-400/40 focus:border-green-500
                        ${touched.username && errors.username ? 'border-red-400 bg-red-50/50' : 'border-green-300'}`}
                    />
                    <FaRegUser className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm pointer-events-none" />
                  </div>
                  {touched.username && errors.username && (
                    <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-green-800 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-white/70 text-green-900 placeholder-green-400 text-sm outline-none transition-all
                        focus:bg-white focus:ring-2 focus:ring-green-400/40 focus:border-green-500
                        ${touched.email && errors.email ? 'border-red-400 bg-red-50/50' : 'border-green-300'}`}
                    />
                    <AiOutlineMail className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-base pointer-events-none" />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Row 2 — Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-green-800 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={passwordEye ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-white/70 text-green-900 placeholder-green-400 text-sm outline-none transition-all
                        focus:bg-white focus:ring-2 focus:ring-green-400/40 focus:border-green-500
                        ${touched.password && errors.password ? 'border-red-400 bg-red-50/50' : 'border-green-300'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordEye(!passwordEye)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-600 transition-colors"
                    >
                      {passwordEye ? <AiFillEye /> : <AiFillEyeInvisible />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-green-800 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={confirmPasswordEye ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Repeat password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-white/70 text-green-900 placeholder-green-400 text-sm outline-none transition-all
                        focus:bg-white focus:ring-2 focus:ring-green-400/40 focus:border-green-500
                        ${touched.confirmPassword && errors.confirmPassword ? 'border-red-400 bg-red-50/50' : 'border-green-300'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmPasswordEye(!confirmPasswordEye)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-600 transition-colors"
                    >
                      {confirmPasswordEye ? <AiFillEye /> : <AiFillEyeInvisible />}
                    </button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-green-700/60 mb-4">
                By creating an account you agree to our{' '}
                <span className="underline cursor-pointer text-green-700">Terms & Conditions</span>{' '}
                and{' '}
                <span className="underline cursor-pointer text-green-700">Privacy Policy</span>
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || loadingState}
                className="w-full py-3 rounded-xl bg-green-900 text-[#e8edea] text-sm font-semibold tracking-wide
                  hover:bg-green-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-green-900/30"
              >
                {loadingState ? "Creating account…" : "Sign up"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-green-300/60" />
              <span className="text-xs text-green-600/60 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-green-300/60" />
            </div>

            <GoogleAuth />

            <p className="mt-5 text-sm text-green-800/70">
              Already have an account?{' '}
              <Link href="/signin" className="text-green-700 font-semibold underline underline-offset-2 hover:text-green-900 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
};

export default Page;











