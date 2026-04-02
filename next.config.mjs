/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure server-only packages are never bundled for the client
  serverExternalPackages: ['winston', 'openai'],
};

export default nextConfig;
