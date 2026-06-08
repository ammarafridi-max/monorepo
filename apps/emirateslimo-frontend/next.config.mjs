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
};

export default nextConfig;
