import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  disable:
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_PWA_DEV !== "true",
  register: true,
  scope: "/",
  sw: "sw.js",
  cacheOnFrontendNav: true,
  cacheStartUrl: true,
  dynamicStartUrl: true,
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactCompiler: true,
};

export default withPWAConfig(nextConfig);
