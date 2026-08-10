import Link from 'next/link';
import Image from 'next/image';
import { AiOutlineInstagram } from 'react-icons/ai';
import { FaFacebookF, FaGithub, FaTwitter } from 'react-icons/fa';



const Footer = () => {

     const date = new Date();
     const year = date.getFullYear();


  return (
   <div className='bg-[#D9D9D9] dark:bg-[#0e0e10] w-full'>
         <div className='pt-5 max-w-287.5 m-auto py-16 px-5'>
            <Link href={'/'} className='cursor-pointer'>
                <Image src={''} alt='logo' width={150} height={150} className='cursor-pointer'/>
                
            </Link>
                
            <div className='flex items-center justify-between flex-wrap lg:flex-nowrap'>
                <div>
                    <p className='font-bold text-3xl text-white'>Subscribe to Our Newsletters</p>
                    <div className='py-4'>
                        <form>
                            <input className='bg-primary border border-input p-6 shadow-xl rounded-lg rounded-r-none w-auto text-2xl' type="email" placeholder='Enter Your Email' />
                            <button className='bg-[#9A3011] text-[#283141] p-6 rounded-lg rounded-l-none shadow-xl hover:shadow-2xl w-auto my-2 dark:text-gray-300 text-2xl'>Subscribe</button>
                        </form>
                    </div>
                    <h2 className='font-bold text-white'>Contact Info</h2>
                    <p className='py-2 text-white '> <span className='text-[#9A3011]'>Address:</span>  <br /> 17 Princess Road, G.R.A, Port Harcourt, Nigeria</p>
                    <p className='py-2 text-white '> <span className='text-[#9A3011]'>Email:</span> <br /> shopnow@gmail.com</p>
                    <p className='py-2 text-white '> <span className='text-[#9A3011]'>Phone:</span> <br /> +234 900 888 5698</p>
                    <div className='flex py-4 text-white'>
                        <AiOutlineInstagram className='cursor-pointer' size={18}/>
                        <FaTwitter className='ml-20 cursor-pointer' size={18}/>
                        <FaFacebookF className='ml-20 cursor-pointer' size={18}/>
                        <FaGithub className='ml-20 cursor-pointer' size={18}/>
                    </div>
                </div>

                <div>
                    <h2 className='font-bold text-white text-[20px]'>About Shopnow</h2>
                    <ul className='py-4'>
                    <Link href={''}> <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'> Contact us</li> </Link>
                    <Link href={''}> <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>About us</li> </Link>
                    <Link href={''}> <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>Careers</li> </Link>
                    <Link href={''}> <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>Our Blogs</li> </Link>
                    <Link href={'/terms-and-condition'}> <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>Terms and conditions</li> </Link> 
                    <Link href={'/privacy-and-policy'}> <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'> Privacy and Policy</li> </Link>
                    </ul>
                </div>

                <div>
                    <h2 className='font-bold text-white text-[20px]'>Customer Care</h2>
                    <ul className='py-4'>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>My account</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>Cart</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>Order History</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>Order Tracking</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>Order Tracking</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011] text-white text-[15px]'>Order Tracking</li>
                    </ul>
                </div>

                <div>
                    <h2 className='font-bold text-white text-[20px]'>Pages</h2>
                    <ul className='py-4'>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011]  text-white text-[15px]'>Blog</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011]  text-white text-[15px]'>Browse the shop</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011]  text-white text-[15px]'>Categories</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011]  text-white text-[15px]'>Pre-built pages</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011]  text-white text-[15px]'>Pre-built pages</li>
                        <li className='py-2 cursor-pointer hover:text-[#9A3011]  text-white text-[15px]'>Pre-built pages</li>
                    </ul>
                </div>  
            </div>
         </div>
         <div className='text-2xl text-center text-[#ffffff] dark:bg-[#0A1930] py-8'> All rights reserved @e-shop.com &copy;{year}.</div>
    </div>

  )
}

export default Footer;
