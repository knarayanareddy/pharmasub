import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.e2b.app"],
  serverExternalPackages: ["pdfkit", "fontkit"],
  poweredByHeader: false,
};

export default nextConfig;
