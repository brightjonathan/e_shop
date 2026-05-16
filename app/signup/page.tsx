"use client";

import { useState } from 'react';
import GoogleAuth from '@/components/GoogleAuth';
import {AiFillEyeInvisible, AiFillEye, AiOutlineMail} from 'react-icons/ai';
import {FaRegUser} from 'react-icons/fa';
import Link from 'next/link';

const Page = () => {

    const [passwordEye, setPasswordEye] = useState(false);
          const handlePasswordEye = () => {
            setPasswordEye(!passwordEye)
          }
          
          const [confirmPasswordEye, setConfirmPasswordEye] = useState(false);
          const handleConfirmPasswordEye = () => {
            setConfirmPasswordEye(!confirmPasswordEye)
          }


  return (
    <div className='pt-2'>

 <div className='max-w-200 m-auto px-4'>
   <div className=' dark:bg-[#e8edea] px-10 py-8 rounded-lg text-black'>
     <h1 className='text-2xl font-bold text-green-800 ' > Register  </h1>
     <form >

       <div className='grid md:grid-cols-2 md:gap-8'>

       <div className='md:my-4'>
           <label>Username</label>
           <div className='my-2 w-full relative'>
             <input
               required
               className='w-full p-2 border border-gray-400 bg-transparent rounded-lg'
               type="text" 
               placeholder='Enter your username'
               name="username"
             
             />
             <FaRegUser className='absolute right-2 top-3 text-gray-400' />
           </div>
           {/* {errors.username && ( <span className="text-red-500">{errors.username}</span>)} */}
         </div>

       <div className='md:my-4'>
           <label>Email Address</label>
           <div className='my-2 w-full relative'>
             <input
               required
               className='w-full p-2 border border-gray-400 bg-transparent rounded-lg'
               type="email" 
               placeholder='Enter Email Address'
               name="email"
             />
             <AiOutlineMail className='absolute right-2 top-4 text-gray-400' /> 
           </div>
           {/* {errors.email && ( <span className="text-red-500">{errors.email}</span>)} */}
         </div> 

       </div>

       <div className='grid md:grid-cols-2 md:gap-8'>

       <div className='md:my-4'>
           <label>Password</label>
           <div className='my-2 w-full relative'>
             <input
               required
               className='w-full p-2 border border-gray-400 bg-transparent rounded-lg'
               type={(passwordEye === false) ? 'password' : 'text'} 
               placeholder='Enter your Password'
               name="password"
             />
             <div className='absolute right-2 top-4'>
               {(passwordEye === false) ? <AiFillEyeInvisible onClick={handlePasswordEye} className='text-gray-400'/> : <AiFillEye onClick={handlePasswordEye} className='text-gray-400'/>}
             </div>
           {/* {errors.password && ( <span className="text-red-500">{errors.password}</span>)} */}
           </div>
         </div>

         <div className='md:my-4'>
           <label>Comfirm Password</label>
           <div className='my-2 w-full relative '>
             <input
               required
               className='w-full p-2 border border-gray-400 bg-transparent rounded-lg' 
               type={(confirmPasswordEye === false) ? 'password' : 'text'} 
               placeholder='comfirm password'
               name="confirmPassword"
             />
             <div className='absolute right-2 top-4'>
               {(confirmPasswordEye === false) ? <AiFillEyeInvisible onClick={handleConfirmPasswordEye} className='text-gray-400'/> : <AiFillEye onClick={handleConfirmPasswordEye} className='text-gray-400'/>}
             </div>
             {/* {errors.confirmPassword && ( <span className="text-red-500">{errors.confirmPassword}</span>)} */}
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
  )
}

export default Page
