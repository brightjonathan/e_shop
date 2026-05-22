"use client";

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import GoogleAuth from '@/components/GoogleAuth';
import { AiFillEyeInvisible, AiFillEye, AiOutlineMail } from 'react-icons/ai';
import { loginUser } from '@/lib/Actions/UserAuth.action';
import Loading from '@/components/Loading';
import { loginSchema } from '@/components/SchemeIndex';
import AuthRedirect from '@/components/AuthRedirect';

const Page = () => {
  const router = useRouter();
  const [loadingState, setLoadingState] = useState(false);
  const [passwordEye, setPasswordEye] = useState(false);

  const onSubmit = async (
    { email, password }: { email: string; password: string },
    actions: { resetForm: () => void }
  ) => {
    setLoadingState(true);
    try {
      await loginUser(email, password);
      toast.success("Logged in successfully!");
      router.push("/");
    } catch (error) {
      toast.error("Invalid email or password.");
    } finally {
      setLoadingState(false);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      actions.resetForm();
    }
  };

  const { values, handleBlur, touched, errors, handleChange, handleSubmit, isSubmitting } = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit,
  });

  return (
    <AuthRedirect>
      {loadingState && <Loading />}

      {/* ── PAGE: SIGN IN ── split layout, left panel + right form */}
      <div className="min-h-screen flex bg-[#e8edea]">

        {/* Left decorative panel — visible on md+ */}
        <div className="hidden md:flex md:w-5/12 lg:w-[45%] relative flex-col justify-between
          bg-green-900 px-10 py-12 overflow-hidden">

          {/* Background texture rings */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full border border-green-700/40" />
            <div className="absolute -top-12 -left-12 w-56 h-56 rounded-full border border-green-700/30" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-green-800/50" />
            <div className="absolute top-1/2 -right-20 w-48 h-48 rounded-full border border-green-700/20" />
          </div>

          {/* Brand mark */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-auto">
              <div className="w-8 h-8 rounded-lg bg-green-400/20 border border-green-500/40 flex items-center justify-center">
                <div className="w-3 h-3 rounded-sm bg-green-300" />
              </div>
              <span className="text-green-200 font-semibold tracking-wide text-sm">e-shop</span>
            </div>
          </div>

          {/* Centre copy */}
          <div className="relative z-10 my-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Welcome<br />back.
            </h2>
            <p className="text-green-300/80 text-sm leading-relaxed max-w-xs">
              Sign in to access your order, manage your profile, and pick up right where you left off.
            </p>
          </div>

          {/* Bottom quote */}
          <div className="relative border-t border-green-700/40 pt-6">
            <p className="text-green-300/60 text-xs italic leading-relaxed">
              &ldquo;Great things are done by a series of small things brought together.&rdquo;
            </p>
            <p className="text-green-400/50 text-xs mt-1">— Vincent van Gogh</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md">

            {/* Mobile-only brand */}
            <div className="flex md:hidden items-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-lg bg-green-800 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-sm bg-green-300" />
              </div>
              <span className="text-green-900 font-semibold text-sm">e-shop</span>
            </div>

            <div className="mb-8">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-green-600 mb-1">
                Sign in
              </p>
              <h1 className="text-3xl font-bold text-green-900">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-green-700/60">
                Enter your credentials to continue.
              </p>
            </div>

            <form autoComplete="off" onSubmit={handleSubmit} noValidate className="space-y-5">

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
                    className={`w-full px-4 py-3 pr-10 rounded-xl border text-green-900 placeholder-green-400 text-sm outline-none transition-all bg-white
                      focus:ring-2 focus:ring-green-400/40 focus:border-green-500
                      ${touched.email && errors.email ? 'border-red-400 bg-red-50' : 'border-green-200'}`}
                  />
                  <AiOutlineMail className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-base pointer-events-none" />
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold tracking-widest uppercase text-green-800">
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-xs text-green-600 hover:text-green-800 underline underline-offset-2 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={passwordEye ? 'text' : 'password'}
                    name="password"
                    placeholder="Your password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 pr-10 rounded-xl border text-green-900 placeholder-green-400 text-sm outline-none transition-all bg-white
                      focus:ring-2 focus:ring-green-400/40 focus:border-green-500
                      ${touched.password && errors.password ? 'border-red-400 bg-red-50' : 'border-green-200'}`}
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

              {/* Terms */}
              <p className="text-center text-xs text-green-700/60">
                By signing in you agree to our{' '}
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
                  shadow-lg shadow-green-900/20"
              >
                {loadingState ? "Signing in…" : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-green-300/50" />
              <span className="text-xs text-green-600/60 font-medium">or</span>
              <div className="flex-1 h-px bg-green-300/50" />
            </div>

            <GoogleAuth />

            <p className="mt-6 text-sm text-green-800/70">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-green-700 font-semibold underline underline-offset-2 hover:text-green-900 transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
};

export default Page;


