"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { AiOutlineMail} from 'react-icons/ai';
import { ResetPassword } from "@/lib/Actions/UserAuth.action";
import { resetPasswordSchema } from "@/components/SchemeIndex";
import { useFormik } from "formik";

const Page = () => {

  const [loadingState, setLoadingState] = useState(false);
  const router = useRouter();


   const onSubmit = async (
    { email }: { email: string },
    actions: { resetForm: () => void }
  ) => {
    setLoadingState(true);
    try {
      await ResetPassword(email);
      toast.success("Password reset email sent! Check your inbox.");
      // router.push("/");
    } catch (error) {
      toast.error("Failed to send reset email. Check the email address.");
      console.log(error);
    } finally {
      setLoadingState(false);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      actions.resetForm();
    }
  };

  const { values, handleBlur, touched, errors, handleChange, handleSubmit, isSubmitting } =
    useFormik({
      initialValues: {
        email: "",
      },
      validationSchema: resetPasswordSchema,
      onSubmit,
    });


  return (
    <div className='pt-15'>
  <div className='max-w-200 m-auto px-4'>
    <div className=' dark:bg-[#e8edea] px-10 py-8 rounded-lg text-black'>
      <h1 className='text-2xl font-bold text-green-800 text-center'> Re-set Account </h1>
      <form autoComplete='on'  onSubmit={handleSubmit}>

        <div className='grid md:grid-cols-1 md:gap-8'>

        <div className='md:my-4'>
            <label>Email Address</label>
            <div className='my-2 w-full relative'>
              <input
               required
                type="email" 
                placeholder='Enter Email Address'
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-2 border bg-transparent rounded-lg ${
                  touched.email && errors.email ? "border-red-500" : "border-gray-400"
                }`}
              />
              <AiOutlineMail className='absolute right-2 top-4 text-gray-400' /> 
            </div>
             {touched.email && errors.email && (
              <span className="text-red-500 text-sm mt-1">{errors.email}</span>
            )}
          </div> 


        </div>


        <p className='text-center text-sm py-1'>By signing in you accept our <span className='underline'>terms and conditions & privacy policy</span></p>
               
        <button 
        type='submit' 
        disabled={isSubmitting || loadingState} 
        className='w-full my-4 md:my-2 p-3 bg-[black] text-white rounded-lg font-semibold'> {loadingState ? "Sending..." : "Send Reset Email"}</button>
      </form>

      
      <hr className="my-6 border-gray-300 w-full" />

      <p className='my-4'>already have an account? <Link href={'/signin'} className='text-[#3e3e8b] underline text-[15px]'>Login</Link></p>
    </div>
  </div>
</div>
  )
}

export default Page;
