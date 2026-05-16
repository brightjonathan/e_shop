import { FcGoogle } from 'react-icons/fc';

const GoogleAuth = () => {
  return (
    <button className="w-full block bg-white hover:bg-gray-100 focus:bg-gray-100 text-gray-900 font-semibold rounded-lg px-4 py-3 border border-gray-300">
    <div className="flex items-center justify-center">
    <FcGoogle className='w-7 h-7'/>
        <span className="ml-4"> login with Google </span>
    </div>
   </button>
  )
}

export default GoogleAuth;
