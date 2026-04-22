'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import BlogCard from '../cards/BlogCard';

export default function BlogPostsCarousel({ blogs }) {
  if (!blogs?.length) return null;

  return (
    <div className="lg:hidden mt-10">
      <Swiper spaceBetween={16} slidesPerView={1.1} className="overflow-visible">
        {blogs.map(post => (
          <SwiperSlide
            key={post._id}
            className="bg-white rounded-3xl overflow-hidden cursor-pointer duration-300 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
          >
            <BlogCard blog={post} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
