"use client";

import { FaBars } from "react-icons/fa6"
import { FaTimes } from "react-icons/fa";


interface HamXParams {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const HamX = (params: HamXParams) => {

    const { isOpen, setIsOpen } = params;

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

    return (
   <div>
      {!isOpen && (
        <button
          onClick={toggleMenu}
          className="flex items-center gap-2 hover:text-gray-400"
        >
          <FaBars className="w-6 h-6"/>
        </button>
      )}
      {isOpen && (
        <button onClick={toggleMenu} className="text-gray-500 text-2xl">
          <FaTimes />
        </button>
      )}
    </div>
  )
}

export default HamX
