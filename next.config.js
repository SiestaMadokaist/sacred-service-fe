/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    remotePatterns: [{
      hostname: 's3.ap-southeast-1.amazonaws.com',
      protocol: 'https',
    }]
  }
}

module.exports = nextConfig
