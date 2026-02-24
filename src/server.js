import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import propertiesRoutes from "./routes/properties.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/properties", propertiesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Stonepath Estates API running on port ${PORT} 🚀`));
