"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useFormik, FormikHelpers } from 'formik';
import { useRouter } from "next/navigation";
import {FaRegUser} from 'react-icons/fa';
import {AiFillEyeInvisible, AiFillEye, AiOutlineMail} from 'react-icons/ai';
import GoogleAuth from '@/components/GoogleAuth';
import { BasicSchema } from '@/components/SchemeIndex';
import { registerUser } from '@/lib/Actions/UserAuth.action';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';

const Page = () => {

       const [loadingState, setLoadingState] = useState(false);
       const router = useRouter();

    const [passwordEye, setPasswordEye] = useState(false);
          const handlePasswordEye = () => {
            setPasswordEye(!passwordEye)
          }
          
          const [confirmPasswordEye, setConfirmPasswordEye] = useState(false);
          const handleConfirmPasswordEye = () => {
            setConfirmPasswordEye(!confirmPasswordEye)
          }



  const onSubmit = async (
    {
      username,
      email,
      password,
    }: { username: string; email: string; password: string; confirmPassword: string },
    actions: FormikHelpers<{
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
    }>
  ) => {
    setLoadingState(true);
    try {
      await registerUser(username, email, password);
      toast.success("Account created successfully!");
      router.push("/");
    } catch (error) {
      // toast.error("Something went wrong. Please try again.");
      console.log(error);
      
    } finally {
      setLoadingState(false);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      actions.resetForm();
    }
  };


  const {
    values,
    handleBlur,
    isSubmitting,
    touched,
    errors,
    handleChange,
    handleSubmit,
  } = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: BasicSchema,
    onSubmit,
  });



        


  return (
    <>
    {loadingState && <Loading />}
    <div className='pt-2'>

 <div className='max-w-200 m-auto px-4'>
   <div className=' dark:bg-[#e8edea] px-10 py-8 rounded-lg text-black'>
     <h1 className='text-2xl font-bold text-green-800 ' > Register  </h1>
     <form autoComplete='on' onSubmit={handleSubmit} >

       <div className='grid md:grid-cols-2 md:gap-8'>

       <div className='md:my-4'>
           <label>Username</label>
           <div className='my-2 w-full relative'>
             <input
               required
               className={`w-full p-2 border bg-transparent rounded-lg ${touched.username && errors.username ? "border-red-500" : "border-gray-400"}`}
               type="text" 
               placeholder='Enter your username'
               name="username"
               value={values.username}
               onChange={handleChange}
               onBlur={handleBlur}
             />
             <FaRegUser className='absolute right-2 top-3 text-gray-400' />
           </div>
            {touched.username && errors.username && (<span className="text-red-500 text-sm">{errors.username}</span>)}
         </div>

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
               className={`w-full p-2 border bg-transparent rounded-lg ${touched.email && errors.email ? "border-red-500" : "border-gray-400"}`}
             />
             <AiOutlineMail className='absolute right-2 top-4 text-gray-400' /> 
           </div>
           {touched.email && errors.email && (<span className="text-red-500 text-sm">{errors.email}</span>)}
         </div> 

       </div>

       <div className='grid md:grid-cols-2 md:gap-8'>

       <div className='md:my-4'>
           <label>Password</label>
           <div className='my-2 w-full relative'>
             <input
               required
               type={(passwordEye === false) ? 'password' : 'text'} 
               placeholder='Enter your Password'
               name="password"
               value={values.password}
               onChange={handleChange}
               onBlur={handleBlur}
               className={`w-full p-2 border bg-transparent rounded-lg ${touched.password && errors.password ? "border-red-500" : "border-gray-400"}`}
             />
             <div className='absolute right-2 top-4'>
               {(passwordEye === false) ? <AiFillEyeInvisible onClick={handlePasswordEye} className='text-gray-400'/> : <AiFillEye onClick={handlePasswordEye} className='text-gray-400'/>}
             </div>
           {touched.password && errors.password && (<span className="text-red-500 text-sm">{errors.password}</span>)}
           </div>
         </div>

         <div className='md:my-4'>
           <label>Comfirm Password</label>
           <div className='my-2 w-full relative '>
             <input
               required
               type={(confirmPasswordEye === false) ? 'password' : 'text'} 
               placeholder='comfirm password'
               name="confirmPassword"
               value={values.confirmPassword}
               onChange={handleChange}
               onBlur={handleBlur}
               className={`w-full p-2 border bg-transparent rounded-lg ${touched.confirmPassword && errors.confirmPassword ? "border-red-500" : "border-gray-400"}`}
               />
             <div className='absolute right-2 top-4'>
               {(confirmPasswordEye === false) ? <AiFillEyeInvisible onClick={handleConfirmPasswordEye} className='text-gray-400'/> : <AiFillEye onClick={handleConfirmPasswordEye} className='text-gray-400'/>}
             </div>
             {touched.confirmPassword && errors.confirmPassword && (<span className="text-red-500 text-sm">{errors.confirmPassword}</span>)}
           </div>
         </div>
       </div>

       <p className='text-center text-sm py-1'>By signing in you accept our <span className='underline'>terms and conditions & privacy policy</span></p>
              
       <button type='submit' className='w-full my-4 md:my-2 p-3 bg-[black] text-white rounded-lg font-semibold'> Sign up </button>
     </form>

     
     <hr className="my-6 border-gray-300 w-full" />
  
     <GoogleAuth />

     <p className='my-4'>Already have an account? <Link href={'/signin'} className='text-[#3e3e8b] underline text-[15px]' > Login </Link></p>
   </div>
 </div>
</div>
  </>
  )
}

export default Page
