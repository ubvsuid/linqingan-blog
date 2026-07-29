import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "script-src-attr 'none'",
  "connect-src 'self' https://vitals.vercel-insights.com https://*.vercel-insights.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
  "upgrade-insecure-requests",
  "report-uri /api/csp-report",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  trailingSlash: false,
  turbopack: { root: process.cwd() },
  async redirects() {
    return [
      { source: "/changelog/page/2", destination: "/changelog", statusCode: 301 },
      { source: "/tags/%E6%96%B0%E6%89%8B%E5%85%A5%E9%97%A8", destination: "/tags/beginner", statusCode: 301 },
      { source: "/tags/%E5%9F%BA%E7%A1%80%E5%B7%A5%E7%A8%8B", destination: "/tags/basic-engineering", statusCode: 301 },
      { source: "/tags/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98", destination: "/tags/common-questions", statusCode: 301 },
      { source: "/tags/%E9%94%99%E8%AF%AF%E6%8E%92%E6%9F%A5", destination: "/tags/debugging", statusCode: 301 },
      { source: "/tags/%E8%BF%9B%E9%98%B6%E5%BC%80%E5%8F%91", destination: "/tags/advanced-development", statusCode: 301 },
      { source: "/resources", destination: "/knowledge#reference-tools", statusCode: 301 },
      { source: "/resources/glossary", destination: "/glossary", permanent: true },
      { source: "/resources/error-codes", destination: "/screeps-errors", permanent: true },
      { source: "/resources/tags", destination: "/tags", permanent: true },
      { source: "/projects", destination: "/about#public-projects", statusCode: 301 },
      { source: "/projects/:path*", destination: "/about#public-projects", statusCode: 301 },
    ];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/en", headers: [{ key: "Content-Language", value: "en" }] },
      { source: "/en/:path*", headers: [{ key: "Content-Language", value: "en" }] },
    ];
  },
};

export default nextConfig;
