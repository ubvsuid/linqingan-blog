import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  trailingSlash: false,
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/tags/%E6%96%B0%E6%89%8B%E5%85%A5%E9%97%A8",
        destination: "/tags/beginner",
        statusCode: 301,
      },
      {
        source: "/tags/%E5%9F%BA%E7%A1%80%E5%B7%A5%E7%A8%8B",
        destination: "/tags/basic-engineering",
        statusCode: 301,
      },
      {
        source: "/tags/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98",
        destination: "/tags/common-questions",
        statusCode: 301,
      },
      {
        source: "/tags/%E9%94%99%E8%AF%AF%E6%8E%92%E6%9F%A5",
        destination: "/tags/debugging",
        statusCode: 301,
      },
      {
        source: "/tags/%E8%BF%9B%E9%98%B6%E5%BC%80%E5%8F%91",
        destination: "/tags/advanced-development",
        statusCode: 301,
      },
      {
        source: "/resources/glossary",
        destination: "/glossary",
        permanent: true,
      },
      {
        source: "/resources/error-codes",
        destination: "/screeps-errors",
        permanent: true,
      },
      {
        source: "/resources/tags",
        destination: "/tags",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

