'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import FleetCard from '../FleetCard';

export default function FleetSlider({ vehicles = [] }) {
  return (
    <Swiper
      modules={[Pagination]}
      spaceBetween={30}
      slidesPerView={1}
      pagination={{ clickable: true }}
      breakpoints={{
        640: { slidesPerView: 1.5 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
    >
      {vehicles.map((vehicle, i) => (
        <SwiperSlide key={vehicle._id || i}>
          <FleetCard index={i} vehicle={vehicle} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
