/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.monday.com" },
      { protocol: "https", hostname: "www.rentbolt.ca" },
    ],
  },
  // Revalidate building data every 15 minutes
  experimental: {},
};

module.exports = nextConfig;
