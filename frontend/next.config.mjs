/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['192.168.88.18', 'localhost'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
