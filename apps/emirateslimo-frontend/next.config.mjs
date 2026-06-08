import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: join(__dirname, "../../"),
  // frontend-shared: shared admin UI; mapbox-gl: zone-drawing admin page
  transpilePackages: ["@travel-suite/frontend-shared", "mapbox-gl"],
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  // Force apex emirateslimo.com → www.emirateslimo.com (canonical).
  // 308 (permanent) is the Next default; Google treats it as a 301.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "emirateslimo.com" }],
        destination: "https://www.emirateslimo.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
