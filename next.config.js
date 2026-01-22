/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/WasteAdministrationDashboard',
  assetPrefix: '/WasteAdministrationDashboard',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
