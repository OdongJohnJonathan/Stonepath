import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import propertiesRoutes from "./routes/properties.routes.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.routes.js";
import savedRoutes from "./routes/saved.routes.js";
import enquiriesRoutes from "./routes/enquiries.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/properties", propertiesRoutes);
app.use("/users", usersRoutes);
app.use("/saved", savedRoutes);
app.use("/enquiries", enquiriesRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Stonepath Estates API running on port ${PORT} 🚀`));