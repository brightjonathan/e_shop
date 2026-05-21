"use client";
import { useState, useEffect } from "react";
import { useRouter} from "next/navigation";
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

  // auth listener
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

  const checkIn = () => {
    setUserOpen((prev) => !prev);
  };


  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 text-white bg-black">
      <Link href="/">
        <h1 className="text-[#fce3c7]">e-shop</h1>
      </Link>

      {/* Desktop Nav Links */}
      <div className="flex items-center gap-6 lg:gap-8 max-md:hidden">
        <Link href="/" className="hover:text-gray-400 transition">
          Home
        </Link>
        <Link href="/about" className="hover:text-gray-400 transition">
          About Us
        </Link>
        <Link href="/contact" className="hover:text-gray-400 transition">
          Contact
        </Link>
      </div>

      <div>
        {/* Desktop Icons */}
        <ul className="hidden md:flex items-center gap-4">
          <Link
            href="/cart"
            className="flex items-center gap-2 hover:text-gray-400 transition"
          >
            <Image src={assets.cart_icon} alt="cart" width={30} />
          </Link>

          <button
            onClick={checkIn}
            className="flex items-center gap-2 hover:text-gray-400 transition"
          >
            <Image src={assets.user_icon} alt="user" width={30} />
          </button>
        </ul>

        {/* Mobile Icons */}
        <div className="md:hidden flex items-center justify-center gap-3">
          <Link href="/cart">
            <Image src={assets.cart_icon} alt="cart" className="w-10 h-6" />
          </Link>
          <button
            onClick={checkIn}
            className="flex items-center gap-2 hover:text-gray-400 transition"
          >
            <Image src={assets.user_icon} alt="user" className="w-10 h-6" />
          </button>
          <HamX isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>

        {/* User Dropdown */}
        {userOpen && (
          <div className="absolute w-87.5 flex flex-col bg-black text-white top-23 right-0 z-10 rounded-b-2xl max-md:top-12 md:top-12 p-4 gap-3">

            {/* Logged out: show Sign In */}
            <ShowOnLogout>
              <div className="flex justify-center">
                <Link
                  href="/signin"
                  className="hover:text-gray-400 transition"
                  onClick={() => setUserOpen(false)}
                >
                  Login
                </Link>
              </div>
            </ShowOnLogout>

            {/* Logged in: show user info and links */}
            <ShowOnLogin>
              <div className="flex flex-col items-center gap-3">
                <p className="text-[#fce3c7]">Welcome, {displayName}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>

                <Link
                  href="/profile"
                  className="hover:text-gray-400 transition"
                  onClick={() => setUserOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  href="/orders"
                  className="hover:text-gray-400 transition"
                  onClick={() => setUserOpen(false)}
                >
                  My Orders
                </Link>

                {/* Admin link — only visible to admins */}
                <AdminOnlyRoute>
                  <Link
                    href="/admin-panel"
                    className="hover:text-gray-400 transition"
                    onClick={() => setUserOpen(false)}
                  >
                    Admin
                  </Link>
                </AdminOnlyRoute>

                <button
                   onClick={() => handleSignOut(signOutUser, router)}
                  className="hover:text-gray-400 transition"
                >
                  Sign Out
                </button>
              </div>
            </ShowOnLogin>

          </div>
        )}
      </div>

      {/* Mobile Side Menu */}
      {isOpen && (
        <div className="md:hidden absolute w-[70%] h-full flex flex-col bg-black text-white top-13 right-0 z-10">
          <div className="flex flex-col items-center gap-6 mt-16">
            <Link
              href="/"
              className="hover:text-gray-400 transition"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            
            <Link
              href="/about"
              className="hover:text-gray-400 transition"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="hover:text-gray-400 transition"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
          
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;