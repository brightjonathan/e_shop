"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { assets } from "@/public/assets/assets";

const sliderData = [
  {
    id: 1,
    title: "Experience Pure Sound",
    subtitle: "Your Perfect Headphones Awaits",
    offer: "Limited Time Offer",
    discount: "30% Off",
    buttonText1: "Buy Now",
    buttonText2: "Find More",
    imgSrc: assets.header_headphone,
    accent: "#4ade80",
  },
  {
    id: 2,
    title: "Next-Level Gaming",
    subtitle: "Discover PlayStation 5 Today",
    offer: "Hurry Up",
    discount: "Few Left!",
    buttonText1: "Buy Now",
    buttonText2: "Explore Deals",
    imgSrc: assets.header_playstation,
    accent: "#86efac",
  },
  {
    id: 3,
    title: "Power Meets Elegance",
    subtitle: "Apple MacBook Pro Is Here",
    offer: "Exclusive Deal",
    discount: "40% Off",
    buttonText1: "Buy Now",
    buttonText2: "Learn More",
    imgSrc: assets.header_macbook,
    accent: "#bbf7d0",
  },
  
];

const HomeSlide = () => {

  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === currentSlide) return;
      setAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setAnimating(false), 700);
    },
    [animating, currentSlide]
  );

  const goNext = useCallback(() => {
    goTo((currentSlide + 1) % sliderData.length);
  }, [currentSlide, goTo]);

  const goPrev = useCallback(() => {
    goTo((currentSlide - 1 + sliderData.length) % sliderData.length);
  }, [currentSlide, goTo]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(goNext, 4000);
    return () => clearInterval(interval);
  }, [paused, goNext]);

  return (
    <section
      className="relative w-full overflow-hidden bg-[#0d1f0f] select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-green-900/40">
        <div
          key={currentSlide}
          className="h-full bg-linear-to-r from-green-500 to-green-300 origin-left"
          style={{
            animation: paused ? "none" : "progress 4s linear forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes imgFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-12px) rotate(1deg); }
        }
        .slide-text { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .slide-text-delay-1 { animation-delay: 0.08s; }
        .slide-text-delay-2 { animation-delay: 0.16s; }
        .slide-text-delay-3 { animation-delay: 0.24s; }
        .slide-text-delay-4 { animation-delay: 0.32s; }
        .slide-img { animation: fadeIn 0.6s ease both, imgFloat 5s ease-in-out 0.8s infinite; }
      `}</style>

      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide.id}
            className="relative min-w-full flex flex-col-reverse md:flex-row items-center justify-between
              gap-8 md:gap-0 px-6 sm:px-10 md:px-16 lg:px-24
              pt-16 pb-14 md:pt-0 md:min-h-[88vh]"
          >
            {/* Background glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 70% 50%, ${slide.accent}12 0%, transparent 65%)`,
              }}
            />
            {/* Dot grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Left — Copy */}
            <div className="relative z-10 flex-1 max-w-lg">
              {/* Badge */}
              <div
                className="slide-text inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6
                  border border-green-500/30 bg-green-900/40 backdrop-blur-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-xs font-semibold tracking-widest uppercase">
                  {slide.offer}
                </span>
                <span className="text-green-400 text-xs font-bold">{slide.discount}</span>
              </div>

              {/* Title */}
              <h1
                className="slide-text slide-text-delay-1 text-white font-bold leading-[1.08] mb-2
                  text-[clamp(2rem,5vw,3.5rem)]"
              >
                {slide.title}
              </h1>
              <p
                className="slide-text slide-text-delay-2 font-light leading-snug mb-8
                  text-[clamp(1.1rem,2.5vw,1.5rem)]"
                style={{ color: slide.accent }}
              >
                {slide.subtitle}
              </p>

              {/* Buttons */}
              <div className="slide-text slide-text-delay-3 flex items-center gap-4 flex-wrap">
                <button
                  className="group relative overflow-hidden rounded-full font-semibold text-sm
                    px-8 py-3.5 text-green-900 transition-all duration-300
                    hover:scale-105 active:scale-95 shadow-lg"
                  style={{ background: slide.accent }}
                >
                  <span className="relative z-10">{slide.buttonText1}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>

                <button
                  className="group flex items-center gap-2 text-sm font-semibold text-white/70
                    hover:text-white transition-colors duration-200"
                >
                  {slide.buttonText2}
                  <svg
                    className="w-4 h-4 -translate-x-1 group-hover:translate-x-0 transition-transform duration-200"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Slide counter */}
              <div className="slide-text slide-text-delay-4 mt-10 flex items-center gap-3">
                <span className="text-white font-bold text-lg tabular-nums">
                  0{index + 1}
                </span>
                <div className="flex-1 max-w-20 h-px bg-white/10 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-green-400 transition-all duration-700"
                    style={{ width: currentSlide === index ? "100%" : "0%" }}
                  />
                </div>
                <span className="text-white/30 text-sm tabular-nums">
                  0{sliderData.length}
                </span>
              </div>
            </div>

            {/* Right — Image */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
              {/* Glow ring behind image */}
              <div
                className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full blur-3xl opacity-20"
                style={{ background: slide.accent }}
              />
              <div className="slide-img relative">
                <Image
                  src={slide.imgSrc}
                  alt={slide.title}
                  loading="eager"
                  className="relative z-10 drop-shadow-2xl
                    w-44 sm:w-56 md:w-64 lg:w-80 xl:w-96
                    object-contain"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={goPrev}
        aria-label="Previous slide"
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20
          w-10 h-10 md:w-11 md:h-11 rounded-full
          flex items-center justify-center
          border border-green-700/40 bg-green-950/60 backdrop-blur-sm
          text-green-300 hover:bg-green-800/70 hover:text-white
          transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goNext}
        aria-label="Next slide"
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20
          w-10 h-10 md:w-11 md:h-11 rounded-full
          flex items-center justify-center
          border border-green-700/40 bg-green-950/60 backdrop-blur-sm
          text-green-300 hover:bg-green-800/70 hover:text-white
          transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {sliderData.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`rounded-full transition-all duration-500
              ${currentSlide === index
                ? "w-6 h-2 bg-green-400"
                : "w-2 h-2 bg-green-800 hover:bg-green-600"
              }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HomeSlide;



