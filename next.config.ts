import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/astra-test" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isGitHubPages
    ? {
        output: "export",
        basePath,
        assetPrefix: basePath,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
