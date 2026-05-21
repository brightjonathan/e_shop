"use client";

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import GoogleAuth from '@/components/GoogleAuth';
import {AiFillEyeInvisible, AiFillEye, AiOutlineMail} from 'react-icons/ai';
import { loginUser } from '@/lib/Actions/UserAuth.action';
import Loading from '@/components/Loading';
import { loginSchema } from '@/components/SchemeIndex';
import AuthRedirect from '@/components/AuthRedirect';

const Page = () => {


  const router = useRouter();
  const [loadingState, setLoadingState] = useState(false);

   //toggling for password eye
    const [passwordEye, setPasswordEye] = useState(false);
    const handlePasswordEye = () => {
      setPasswordEye(!passwordEye)
    }


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

  const { values, handleBlur, touched, errors, handleChange, handleSubmit, isSubmitting } =
    useFormik({
      initialValues: {
        email: "",
        password: "",
      },
      validationSchema: loginSchema,
      onSubmit,
    });




 

  return (
    <AuthRedirect>
    {loadingState && <Loading />}
     <div className='pt-15'>
  
    <div className='max-w-200 m-auto px-4'>
      <div className=' dark:bg-[#e8edea] px-10 py-8 rounded-lg text-black'>
        <h1 className='text-2xl font-bold text-green-800'> Login </h1>
        <form autoComplete='off'  onSubmit={handleSubmit} >

          <div className='grid md:grid-cols-2 md:gap-8'>

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
            <div className='md:my-4'>
              <label>Password</label>
              <div className='my-2 w-full relative '>
                <input
                  required
                  type={(passwordEye === false) ? 'password' : 'text'} 
                  placeholder='Enter your Password'
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-2 border bg-transparent rounded-lg ${
                    touched.password && errors.password ? "border-red-500" : "border-gray-400"
                  }`}
                  />
                <div className='absolute right-2 top-4'>
                  {(passwordEye === false) ? <AiFillEyeInvisible onClick={handlePasswordEye} className='text-gray-400'/> : <AiFillEye onClick={handlePasswordEye} className='text-gray-400'/>}
                </div>
                {touched.password && errors.password && (
                  <span className="text-red-500 text-sm mt-1">{errors.password}</span>
                )}
              </div>
            </div>

          </div>


          <p className='text-center text-sm py-1'>By signing in you accept our <span className='underline'>terms and conditions & privacy policy</span></p>
                 
          <button 
          type="submit"
          disabled={isSubmitting || loadingState}
          className='w-full my-4 md:my-2 p-3 bg-[black] text-white rounded-lg font-semibold'> {loadingState ? "Signing in..." : "Sign In"} </button>
        </form>

        
        <hr className="my-6 border-gray-300 w-full" />
     
        <GoogleAuth />
        <p className='text-center text-sm py-1 '> Forgotten password? <span className='underline '> <Link href={'/reset-password'} className='text-[#3e3e8b] text-[15px]'>Reset</Link></span></p>

        <p className='my-4'>Don&apos;t have an account? <Link className='text-[green] underline text-[15px]' href={'/signup'}> Register </Link></p>
      </div>
    </div>
  </div>
  </AuthRedirect>
  )
}

export default Page;
