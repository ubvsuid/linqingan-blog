import type { NextConfig } from "next";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "child-src 'none'",
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
  "report-to csp-endpoint",
];

const contentSecurityPolicy = cspDirectives.join("; ");

function createCandidateContentSecurityPolicy() {
  const stricterDirectives = cspDirectives
    .filter((directive) => !directive.startsWith("style-src-attr "))
    .map((directive) =>
      directive.startsWith("script-src ")
        ? directive.replace(" 'unsafe-inline'", "")
        : directive,
    );

  return [...stricterDirectives, "style-src-attr 'none'"].join("; ");
}

const candidateContentSecurityPolicy =
  createCandidateContentSecurityPolicy();
const candidateContentSecurityPolicyHeader = {
  key: "Content-Security-Policy-Report-Only",
  value: candidateContentSecurityPolicy,
};

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), usb=(), web-share=(self), xr-spatial-tracking=(), browsing-topics=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  {
    key: "Reporting-Endpoints",
    value: 'csp-endpoint="https://www.linqingan.com/api/csp-report"',
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  trailingSlash: false,
  turbopack: { root: process.cwd() },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "linqingan.com" }],
        destination: "https://www.linqingan.com/:path*",
        permanent: true,
      },
      {
        source: "/tags/energy-harvesting",
        destination: "/tags/resource-harvesting",
        statusCode: 301,
      },
      {
        source: "/tags/energy-delivery",
        destination: "/tags/logistics",
        statusCode: 301,
      },
      {
        source: "/tags/game-interface",
        destination: "/tags/vision",
        statusCode: 301,
      },
      {
        source: "/tags/debugging-tools",
        destination: "/tags/debugging",
        statusCode: 301,
      },
      {
        source: "/tags/energy-resource",
        destination: "/tags/energy",
        statusCode: 301,
      },
      {
        source: "/tags/screeps-game-api",
        destination: "/tags/game-api",
        statusCode: 301,
      },
      {
        source: "/changelog/page/2",
        destination: "/changelog",
        statusCode: 301,
      },
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
        source: "/resources",
        destination: "/knowledge#reference-tools",
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
      {
        source: "/projects",
        destination: "/about#public-projects",
        statusCode: 301,
      },
      {
        source: "/projects/:path*",
        destination: "/about#public-projects",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/en/verification",
        headers: [candidateContentSecurityPolicyHeader],
      },
      {
        source: "/theme-init.js",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/en",
        headers: [{ key: "Content-Language", value: "en" }],
      },
      {
        source: "/en/:path*",
        headers: [{ key: "Content-Language", value: "en" }],
      },
    ];
  },
};

export default nextConfig;
