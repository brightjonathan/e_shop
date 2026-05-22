"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { assets } from "@/public/assets/assets";
import Link from "next/link";
import Image from "next/image";
import HamX from "./HamX";
import { useAppContext } from "@/Context/AppContextProvider";
import { ShowOnLogin, ShowOnLogout } from "@/components/HiddenLink";
import AdminOnlyRoute from "./AdminOnlyRoute";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/Firebase/client";
import { signOutUser } from "@/lib/Actions/UserAuth.action";
import { handleSignOut } from "./HandleSignOut";

const Header = () => {
  const { user, setUser } = useAppContext();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // ref scoped to just the user-button + dropdown panel
  const userMenuRef = useRef(null);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const name =
          firebaseUser.displayName ??
          firebaseUser.email?.split("@")[0] ??
          "";
        setDisplayName(name);
      } else {
        setUser(null);
        setDisplayName("");
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  // ── Scroll shadow ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Outside-click: only fires when click is OUTSIDE the user-menu wrapper ──
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Close mobile drawer on resize to desktop ───────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ── Avatar sub-component ───────────────────────────────────────────────────
  const UserAvatar = ({ size = "md" }) => {
    const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
    return (
      <div className="relative inline-flex">
        {user?.photoURL ? (
          <Image
            src={user.photoURL}
            alt={displayName}
            width={size === "sm" ? 28 : 36}
            height={size === "sm" ? 28 : 36}
            className={`${dim} rounded-full object-cover ring-2 ring-[#fce3c7]/30`}
          />
        ) : user ? (
          <div
            className={`${dim} rounded-full bg-gradient-to-br from-[#fce3c7] to-[#e8b48a] flex items-center justify-center font-semibold text-black ring-2 ring-[#fce3c7]/30`}
          >
            {getInitials(displayName)}
          </div>
        ) : (
          <Image
            src={assets.user_icon}
            alt="user"
            width={size === "sm" ? 28 : 36}
            height={size === "sm" ? 28 : 36}
            className={`${dim} rounded-full opacity-80`}
          />
        )}
        {user && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
        )}
      </div>
    );
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      {/* ── Fixed Navbar ──────────────────────────────────────────────────── */}
      {/*
        overflow-visible is critical — without it the fixed nav clips the
        absolutely-positioned dropdown and pointer events stop working.
      */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-12 lg:px-24 h-16 bg-black/95 backdrop-blur-md border-b border-white/5 transition-shadow duration-300 overflow-visible ${
          scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.5)]" : ""
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-[#fce3c7] font-bold text-xl tracking-tight group-hover:text-white transition-colors duration-200">
            e-shop
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#fce3c7] group-hover:bg-emerald-400 transition-colors duration-300" />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="relative px-4 py-2 text-sm text-white/70 hover:text-white transition-colors duration-200 group"
            >
              {label}
              <span className="absolute bottom-1 left-4 right-4 h-px bg-[#fce3c7] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </Link>
          ))}
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link
            href="/cart"
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors duration-200"
            aria-label="Cart"
          >
            <Image src={assets.cart_icon} alt="cart" width={22} height={22} />
          </Link>

          {/*
            User button + dropdown are siblings inside ONE ref'd wrapper.
            This means outside-click only fires when the user clicks
            completely outside this wrapper — NOT when they click a link
            inside the dropdown.
          */}
          <div className="relative" ref={userMenuRef}>
            {/* User button */}
            <button
              onClick={() => setUserOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-[#fce3c7]/30 transition-all duration-200 p-0.5"
              aria-label="User menu"
              aria-expanded={userOpen}
            >
              <UserAvatar />
              {displayName && (
                <span className="hidden lg:block text-sm text-white/80 max-w-[100px] truncate pr-1">
                  {displayName.split(" ")[0]}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {userOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-64 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">

                {/* ── Logged out ── */}
                <ShowOnLogout>
                  <div className="p-4 flex flex-col items-center gap-3">
                    <p className="text-white/50 text-xs uppercase tracking-widest">
                      Account
                    </p>
                    <Link
                      href="/signin"
                      onClick={() => setUserOpen(false)}
                      className="w-full text-center bg-[#fce3c7] text-black font-semibold text-sm py-2.5 rounded-xl hover:bg-white transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                  </div>
                </ShowOnLogout>

                {/* ── Logged in ── */}
                <ShowOnLogin>
                  <div className="p-4 flex flex-col gap-1">
                    {/* User info header */}
                    <div className="flex items-center gap-3 pb-3 mb-1 border-b border-white/10">
                      <div className="relative shrink-0">
                        <UserAvatar size="sm" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">
                          {displayName}
                        </p>
                        <p className="text-white/40 text-xs truncate">
                          {user?.email}
                        </p>
                      </div>
                      <span className="ml-auto flex items-center gap-1 text-emerald-400 text-[10px] font-medium shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Online
                      </span>
                    </div>

                    {/* Nav items */}
                    {[
                      { href: "/user-profile", label: "My Profile", icon: "👤" },
                      { href: "/orders", label: "My Orders", icon: "📦" },
                    ].map(({ href, label, icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/8 transition-all duration-150 text-sm"
                      >
                        <span>{icon}</span>
                        {label}
                      </Link>
                    ))}

                    {/* Admin link */}
                    <AdminOnlyRoute>
                      <Link
                        href="/admin-panel"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#fce3c7]/80 hover:text-[#fce3c7] hover:bg-[#fce3c7]/8 transition-all duration-150 text-sm"
                      >
                        <span>⚡</span>
                        Admin Panel
                      </Link>
                    </AdminOnlyRoute>

                    {/* Sign Out */}
                    <div className="mt-1 pt-2 border-t border-white/10">
                      <button
                        onClick={() => {
                          handleSignOut(signOutUser, router);
                          setUserOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-400/8 transition-all duration-150 text-sm"
                      >
                        <span>→</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </ShowOnLogin>

              </div>
            )}
          </div>{/* end userMenuRef wrapper */}

          {/* Hamburger — mobile only */}
          <div className="md:hidden">
            <HamX isOpen={isOpen} setIsOpen={setIsOpen} />
          </div>
        </div>
      </nav>

      {/* Spacer — prevents content from sliding under the fixed nav */}
      <div className="h-16" />

      {/* ── Mobile Side Drawer ────────────────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="md:hidden fixed top-0 right-0 z-50 h-full w-72 bg-[#0d0d0d] border-l border-white/10 flex flex-col pt-20 px-6 pb-8 shadow-2xl">
            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-4">
              Navigation
            </p>

            <div className="flex flex-col gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/8 transition-all duration-150 text-base"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Logged-in user info pinned to bottom of drawer */}
            {user && (
              <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-3">
                <div className="relative">
                  <UserAvatar size="sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {displayName}
                  </p>
                  <p className="text-white/40 text-xs truncate">{user?.email}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Header;
