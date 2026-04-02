/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Prevent server-only packages from being bundled for the client (Next.js 14 syntax)
    serverComponentsExternalPackages: ['winston', 'openai'],
  },
};

export default nextConfig;
