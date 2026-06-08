'use client';
import { useBlogs } from '../../hooks/blog/useBlogs';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import BlogCard from '../BlogCard';
import Container from '../Container';
import PrimarySection from '../PrimarySection';
import SectionTitle from '../SectionTitle';

export default function BlogPosts({ title = 'Blog Posts', subtitle = 'Recently published blog posts' }) {
  const { blogs, isLoadingBlogs, isErrorBlogs } = useBlogs({ limit: 3 });

  return (
    <PrimarySection className="pb-15 lg:pb-30">
      <Container>
        <SectionTitle subtitle={subtitle} textAlign="center" className="mb-10 md:mb-12">
          {title}
        </SectionTitle>

        <div className="lg:hidden mt-10">
          <Swiper spaceBetween={16} slidesPerView={1.1} className="overflow-visible">
            {blogs?.map((post) => (
              <SwiperSlide
                key={post._id}
                className="bg-white rounded-3xl overflow-hidden cursor-pointer duration-300 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
              >
                <BlogCard blog={post} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="hidden lg:grid lg:grid-cols-3 gap-8 mt-10">
          {blogs?.map((post) => (
            <BlogCard key={post._id} blog={post} />
          ))}
        </div>

        {isLoadingBlogs && <p className="text-center text-gray-500 text-sm mt-6">Loading blog posts...</p>}
        {isErrorBlogs && <p className="text-center text-red-500 text-sm mt-6">Unable to load blog posts right now.</p>}
      </Container>
    </PrimarySection>
  );
}
