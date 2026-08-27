import "dotenv/config";

// Stop right away if a secret is missing, instead of failing later on a login.
const requiredKeys = ["DB_NAME", "DB_USER", "JWT_SECRET", "RESET_TOKEN_SECRET"];

for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable: ${key}. Copy backend/.env.example to backend/.env and fill it in.`
    );
  }
}

const nodeEnv = process.env.NODE_ENV || "development";

// Every setting the app needs, in one place. Nothing else reads process.env.
export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT) || 5000,

  // Only turn this on when a real proxy (nginx, a host's router) sits in front
  // of the API. Otherwise a client can fake its IP and skip rate limiting.
  trustProxy: process.env.TRUST_PROXY === "true",

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },

  resetToken: {
    secret: process.env.RESET_TOKEN_SECRET,
    expiresIn: process.env.RESET_TOKEN_EXPIRES_IN || "15m",
  },

  cookie: {
    name: process.env.AUTH_COOKIE_NAME || "admin_token",
    // HTTPS-only in production. Forcing it in development would stop the
    // cookie being saved at all on http://localhost.
    secure: nodeEnv === "production",
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
  },

  otp: {
    expiresInMinutes: Number(process.env.OTP_EXPIRES_IN_MINUTES) || 10,
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
  },

  mail: {
    host: process.env.MAIL_HOST || "",
    port: Number(process.env.MAIL_PORT) || 587,
    user: process.env.MAIL_USER || "",
    password: process.env.MAIL_PASSWORD || "",
    from: process.env.MAIL_FROM || "Admin System <no-reply@localhost>",
  },

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
