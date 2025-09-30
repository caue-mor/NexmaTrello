/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  eslint: {
    // Desabilitar ESLint durante build em produção
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desabilitar verificação de tipos durante build em produção
    ignoreBuildErrors: true,
  },
};

export default nextConfig;