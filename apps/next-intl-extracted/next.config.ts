import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withNextIntl = createNextIntlPlugin({
  experimental: {
    // Messages are extracted from `useExtracted` calls into `messages/en.json`
    // during `next dev` and `next build`, other locales are kept in sync
    extract: true,
    srcPath: "./src",
    messages: {
      path: "./messages",
      format: "json",
      locales: "infer",
      sourceLocale: "en",
    },
  },
});
export default withNextIntl(nextConfig);
