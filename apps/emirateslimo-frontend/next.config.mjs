import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: join(__dirname, "../../"),
  transpilePackages: ["@travel-suite/frontend-shared", "mapbox-gl"],
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
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
