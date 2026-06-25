import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { sanitizeInput } from "./middleware/sanitize.js";
import pool from "./db.js";

// Import routes
import propertiesRoutes from "./routes/properties.routes.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.routes.js";
import savedRoutes from "./routes/saved.routes.js";
import enquiriesRoutes from "./routes/enquiries.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import shortStaysRoutes from "./routes/shortStays.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import inspectionsRoutes from "./routes/inspections.routes.js";
import serviceProvidersRoutes from "./routes/serviceProviders.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";

// ✅ Initialize express app FIRST (before using it)
const app = express();

// ── DATABASE MAINTENANCE ──────────────────────────
// Check and expire premium accounts every hour
const expirePremiumAccounts = async () => {
  try {
    const result = await pool.query(
      `UPDATE users
       SET is_premium = false
       WHERE is_premium = true
       AND premium_expires_at IS NOT NULL
       AND premium_expires_at < NOW()
       RETURNING id, email`
    );
    if (result.rows.length > 0) {
      console.log(`⏰ Expired premium for ${result.rows.length} accounts`);
    }
  } catch (err) {
    console.error('Premium expiry check failed:', err.message);
  }
};

// Run on startup and every hour
expirePremiumAccounts();
setInterval(expirePremiumAccounts, 60 * 60 * 1000);

// ── SECURITY HEADERS ──────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── CORS ──────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ── BODY PARSING ──────────────────────────────────
app.use(express.json({ limit: "10kb" }));

// ── INPUT SANITIZATION ────────────────────────────
app.use(sanitizeInput);

// ── RATE LIMITERS ─────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);
app.use("/auth", authLimiter);

// ── ROUTES ────────────────────────────────────────
app.use("/payments", paymentsRoutes);
app.use("/auth", authRoutes);
app.use("/properties", propertiesRoutes);
app.use("/users", usersRoutes);
app.use("/saved", savedRoutes);
app.use("/enquiries", enquiriesRoutes);
app.use("/admin", adminRoutes);
app.use("/inspections", inspectionsRoutes);
app.use("/short-stays", shortStaysRoutes);
app.use("/service-providers", serviceProvidersRoutes);
app.use("/newsletter", newsletterRoutes);

// ── HEALTH CHECK ──────────────────────────────────
app.get("/health", (req, res) => res.json({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

// ── 404 HANDLER ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(err.status || 500).json({
    error: isDev ? err.message : "Something went wrong. Please try again.",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Stonepath Estates API running on port ${PORT} 🚀`));