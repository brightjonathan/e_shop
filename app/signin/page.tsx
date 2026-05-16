"use client";

import { useState } from 'react';
import Link from 'next/link';
import GoogleAuth from '@/components/GoogleAuth';
import {AiFillEyeInvisible, AiFillEye, AiOutlineMail} from 'react-icons/ai';

const Page = () => {

   //toggling for password eye
    const [passwordEye, setPasswordEye] = useState(false);
    const handlePasswordEye = () => {
      setPasswordEye(!passwordEye)
    }


  return (
     <div className='pt-15'>
  
    <div className='max-w-200 m-auto px-4'>
      <div className=' dark:bg-[#e8edea] px-10 py-8 rounded-lg text-black'>
        <h1 className='text-2xl font-bold text-green-800'> Login </h1>
        <form >

          <div className='grid md:grid-cols-2 md:gap-8'>

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

            <div className='md:my-4'>
              <label>Password</label>
              <div className='my-2 w-full relative '>
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
              </div>
              {/* {errors.password && ( <span className="text-red-500">{errors.password}</span>)} */}
            </div>

          </div>


          <p className='text-center text-sm py-1'>By signing in you accept our <span className='underline'>terms and conditions & privacy policy</span></p>
                 
          <button type='submit' className='w-full my-4 md:my-2 p-3 bg-[black] text-white rounded-lg font-semibold'> Login Account </button>
        </form>

        
        <hr className="my-6 border-gray-300 w-full" />
     
        <GoogleAuth />
        <p className='text-center text-sm py-1 '> Forgotten password? <span className='underline '> <Link href={'/reset-password'} className='text-[#3e3e8b] text-[15px]'>Reset</Link></span></p>

        <p className='my-4'>Don&apos;t have an account? <Link className='text-[green] underline text-[15px]' href={'/signup'}> Register </Link></p>
      </div>
    </div>
  </div>
  )
}

export default Page;
