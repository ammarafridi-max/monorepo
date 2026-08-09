export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/apply"],
    },
    sitemap: "https://www.visawadi.ae/sitemap.xml",
  };
}
