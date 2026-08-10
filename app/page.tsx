"use client"

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import HomeSlide from '@/components/HomeSlide';
import Products from '@/components/Products';
import { useReloadOnVisit } from '@/lib/UseRelaodOnce';

const Home = () => {

    //ReLoad page once when user visit the home page
    useReloadOnVisit("reLoadedHome");

  return (
    <div>
      <Header/>

      <div>
        <HomeSlide/>
        <Products/>
      </div>

      <Footer/>
      
    </div>
  )
}

export default Home;
