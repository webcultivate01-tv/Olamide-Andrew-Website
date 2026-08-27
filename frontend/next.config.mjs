// Uploaded case study images are served by the Express API, on its own origin.
// next/image refuses a remote host it has not been told about, so the API's
// host is derived from the same variable lib/api.js uses rather than written
// out twice and left to drift.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const { protocol, hostname, port } = new URL(apiUrl);

// Next 16 refuses to optimise an image on a local address at all, whatever the
// remote patterns say — it is an SSRF guard, and the flag that lifts it is
// named to be alarming. In development the API genuinely is on localhost, so
// without this every uploaded image would 400 on the page that shows it.
//
// It is switched on only when the configured API host is itself local, which
// is our own setting and not anything a request can influence. Point
// NEXT_PUBLIC_API_URL at a real hostname and the guard is back on.
const isLocalApi = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hides the Next.js dev-tools badge that otherwise sits over the
  // bottom-left of every page in development. Compile and runtime errors
  // are still surfaced.
  devIndicators: false,

  images: {
    remotePatterns: [
      {
        protocol: protocol.replace(":", ""),
        hostname,
        port,
        // Only the uploads folder. Nothing else the API serves is an image,
        // and this stops the optimiser being pointed at arbitrary paths.
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowLocalIP: isLocalApi,
  },
};

export default nextConfig;
