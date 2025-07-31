import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'images.pexels.com',   // Voor Pexels afbeeldingen
      'images.unsplash.com', // Voor Unsplash afbeeldingen
      'cdn.pixabay.com',     // Voor Pixabay afbeeldingen
      // Voeg hier eventueel andere externe domeinen toe
    ],
  },
  // Andere Next.js configuraties...
};

export default nextConfig;
