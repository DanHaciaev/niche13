"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

export function NewsCarousel({ images, label }: { images: string[]; label: string }) {
  // Swiper's loop mode needs enough real slides to build its clones from —
  // with only a handful of source photos and a wide viewport that can fit
  // most of them at once, there isn't enough to loop from natively.
  // Repeating the source list gives it plenty of real slides to work with.
  const repeat = Math.max(4, Math.ceil(16 / images.length));
  const slides = Array.from({ length: repeat }, () => images).flat();

  const swiperRef = useRef<SwiperType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Autoplay only runs while the slider is actually on screen, so it never
  // silently advances (and lands on some unexpected slide) while scrolled
  // out of view.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper?.autoplay) return;
    if (visible) swiper.autoplay.start();
    else swiper.autoplay.stop();
  }, [visible]);

  return (
    <div ref={containerRef} role="region" aria-label={label} className="relative overflow-hidden mb-15">
      <button
        type="button"
        aria-label="Previous"
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute left-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 sm:left-4 sm:h-12 sm:w-12"
      >
        {/* The arrow is a see-through cut-out in a white disc; a smaller black disc
            behind it makes the arrow solid black on any photo. */}
        <span aria-hidden className="absolute inset-[12%] rounded-full bg-black" />
        <Image src="/arrow.png" alt="" fill className="object-contain" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 sm:right-4 sm:h-12 sm:w-12"
      >
        <span aria-hidden className="absolute inset-[12%] rounded-full bg-black" />
        <Image src="/arrow.png" alt="" fill className="rotate-180 object-contain" />
      </button>

      <div className="py-13 md:py-20 lg:py-25">
        <Swiper
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          modules={[Autoplay]}
          loop
          loopAdditionalSlides={images.length}
          centeredSlides
          slidesPerView="auto"
          spaceBetween={12}
          grabCursor
          speed={600}
          autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: false }}
          breakpoints={{
            640: { spaceBetween: 16 },
            1024: { spaceBetween: 20 },
          }}
          className="niche-carousel"
        >
          {slides.map((src, i) => (
            <SwiperSlide key={`${src}-${i}`} className="niche-carousel-slide">
              <Image
                src={src}
                alt=""
                fill
                draggable={false}
                sizes="(min-width: 1600px) 391px, (min-width: 1024px) 25vw, (min-width: 640px) 38vw, 62vw"
                className="pointer-events-none object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
