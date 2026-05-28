import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  env: {
    NEXT_PUBLIC_JILL_INBOX_EMAIL: process.env.JILL_INBOX_EMAIL,
  },
};

export default nextConfig;
