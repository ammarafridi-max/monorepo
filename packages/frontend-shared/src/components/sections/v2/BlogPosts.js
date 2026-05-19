import { getPublishedBlogsApi } from '../../../services/apiBlog.js';
import PrimarySection from '../../shared/layout/PrimarySection.js';
import Container from '../../shared/layout/Container.js';
import BlogCard from '../../cards/v2/BlogCard.js';

export const revalidate = 300;

export default async function BlogPosts({
  title = 'From the Blog',
  subtitle = 'Guides and tips on visa applications, travel documents, and planning your trip',
}) {
  let blogs = [];
  let isErrorBlogs = false;

  try {
    const data = await getPublishedBlogsApi({ limit: 3 });
    blogs = data?.blogs || [];
  } catch {
    isErrorBlogs = true;
  }

  return (
    <PrimarySection className="py-20 bg-gray-50">
      <Container>
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((post) => (
            <BlogCard
              key={post._id}
              slug={post.slug}
              category={post.category}
              title={post.title}
              excerpt={post.excerpt}
              author={post.author}
              date={post.publishedAt || post.createdAt}
              readTime={post.readingTime}
              coverImageUrl={post.coverImageUrl}
              tags={post.tags}
            />
          ))}
        </div>

        {!blogs.length && !isErrorBlogs && (
          <p className="text-center text-gray-400 text-sm mt-6">No blog posts available right now.</p>
        )}
        {isErrorBlogs && (
          <p className="text-center text-red-400 text-sm mt-6">Unable to load blog posts right now.</p>
        )}
      </Container>
    </PrimarySection>
  );
}
