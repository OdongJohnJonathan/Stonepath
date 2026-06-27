// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   reactCompiler: true,
//   turbopack: {
//     root: __dirname,
//   },
// };

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   allowedDevOrigins: ['192.168.1.137'],
// }

// module.exports = nextConfig

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['192.168.1.115'],
};

export default nextConfig;