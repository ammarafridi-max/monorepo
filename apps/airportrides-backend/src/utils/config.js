import { createBackendConfig } from "@travel-suite/backend-app/config";

export default createBackendConfig({
  brandKey: "airportrides",
  port: 4003,
  overrides: {
    airlabs: {
      apiKey: process.env.AIRLABS_API_KEY,
    },

    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
    },

    ipInfo: {
      apiKey: process.env.IPINFO_API_KEY,
    },
  },
});
