'use client';
import { useVehicles } from '../../hooks/vehicles/useVehicles';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import PrimarySection from '../PrimarySection';
import Container from '../Container';
import SectionTitle from '../SectionTitle';
import FleetCard from '../FleetCard';
import PrimaryLink from '../PrimaryLink';

export default function Fleet({ title = 'Luxury Vehicles To Choose From', subtitle = 'Our Fleet' }) {
  const { vehicles } = useVehicles();

  return (
    <PrimarySection className="py-15 lg:py-30">
      <Container>
        <SectionTitle textAlign="center" subtitle={subtitle}>
          {title}
        </SectionTitle>
        <Swiper
          modules={[Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 1.5 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {vehicles?.map((v, i) => (
            <SwiperSlide key={v._id || i}>
              <FleetCard index={i} vehicle={v} />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="mt-10 flex items-center justify-center">
          <PrimaryLink to="/fleet">View Full Fleet</PrimaryLink>
        </div>
      </Container>
    </PrimarySection>
  );
}
