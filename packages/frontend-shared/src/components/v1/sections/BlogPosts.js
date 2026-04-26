import { getPublishedBlogsApi } from '../../../services/apiBlog';
import BlogCard from '../cards/BlogCard';
import Container from '../layout/Container';
import PrimarySection from '../layout/PrimarySection';
import SectionTitle from '../layout/SectionTitle';

export const revalidate = 300;

export default async function BlogPosts({
  title = 'Blog Posts',
  subtitle = 'Recently published blog posts',
}) {
  let blogs = [];
  let isErrorBlogs = false;

  try {
    const data = await getPublishedBlogsApi({ limit: 3 });
    blogs = data?.blogs || [];
  } catch (error) {
    void error;
    isErrorBlogs = true;
  }

  return (
    <PrimarySection className="py-14 md:py-18 lg:py-24">
      <Container>
        <SectionTitle
          subtitle={subtitle}
          textAlign="center"
          className="mb-10 md:mb-12"
        >
          {title}
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {blogs?.map((post) => (
            <BlogCard key={post._id} blog={post} />
          ))}
        </div>

        {!blogs.length && !isErrorBlogs && (
          <p className="text-center text-gray-500 text-sm mt-6">
            No blog posts available right now.
          </p>
        )}
        {isErrorBlogs && (
          <p className="text-center text-red-500 text-sm mt-6">
            Unable to load blog posts right now.
          </p>
        )}
      </Container>
    </PrimarySection>
  );
}
