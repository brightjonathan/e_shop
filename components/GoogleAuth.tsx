"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import { googleSignIn } from "@/lib/Actions/UserAuth.action";

const GoogleAuth = () => {


   const [loadingState, setLoadingState] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoadingState(true);
    try {
      await googleSignIn();
      toast.success("Signed in with Google!");
      router.push("/");
    } catch (error) {
      toast.error("Google sign in failed. Please try again.");
      console.log(error);
    } finally {
      setLoadingState(false);
    }
  };
  return (
    <button 
      onClick={handleGoogleSignIn}
      disabled={loadingState}
    className="w-full block bg-white hover:bg-gray-100 focus:bg-gray-100 text-gray-900 font-semibold rounded-lg px-4 py-3 border border-gray-300">
    <div className="flex items-center justify-center">
    <FcGoogle className='w-7 h-7'/>
        {loadingState ? "Signing in..." : "Login with Google"}
    </div>
   </button>
  )
}

export default GoogleAuth;
