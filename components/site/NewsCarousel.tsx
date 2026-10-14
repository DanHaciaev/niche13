"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

const RATIO = 258 / 345;
const PAD = 60; // fixed 60px top/bottom, never changes regardless of which item is active
const ACTIVE_W_CSS = "clamp(11.5rem, 32vw, 19.5625rem)"; // 313px at desktop

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
        <Image src="/arrow.png" alt="" fill className="object-contain" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 sm:right-4 sm:h-12 sm:w-12"
      >
        <Image src="/arrow.png" alt="" fill className="rotate-180 object-contain" />
      </button>

      <div style={{ paddingBlock: PAD, height: `calc(${ACTIVE_W_CSS} / ${RATIO} + ${PAD * 2}px)` }}>
        <Swiper
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          modules={[Autoplay]}
          loop
          loopAdditionalSlides={images.length}
          centeredSlides
          slidesPerView="auto"
          spaceBetween={24}
          grabCursor
          speed={600}
          autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: false }}
          breakpoints={{
            640: { spaceBetween: 32 },
            1024: { spaceBetween: 40 },
          }}
          className="niche-carousel h-full overflow-visible!"
        >
          {slides.map((src, i) => (
            <SwiperSlide key={`${src}-${i}`} className="niche-carousel-slide">
              <div className="niche-carousel-slide-inner">
                <Image
                  src={src}
                  alt=""
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 20vw, 32vw"
                  priority={i === 0}
                  className="pointer-events-none object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
