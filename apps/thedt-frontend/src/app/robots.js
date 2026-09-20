export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/booking",
        "/insurance-booking/quote",
        "/insurance-booking/passengers",
        "/insurance-booking/review",
        "/insurance-booking/payment",
      ],
    },
    sitemap: "https://www.thedummyticket.ae/sitemap.xml",
  };
}
