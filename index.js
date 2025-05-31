import express from "express";
import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();

import gymRoutes from "./module/gyms/routes.js";
import paymentRoutes from "./module/payments/routes.js";
import memberRoutes from "./module/members/routes.js";
import cors from "cors";
import fs from "fs";
import path from "path";

mongoose
  .connect(process.env.MONGODB_URI)
  .then(console.log("MongoDb connected"))
  .catch((err) => console.log("Mongo Error", err));

const port = process.env.PORT;
const app = express();
app.use(express.json());

const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!json) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
const serviceAccountPath = path.join("/tmp", "service-account.json");
if (!fs.existsSync(serviceAccountPath)) {
  fs.writeFileSync(serviceAccountPath, json);
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;

app.use(
  cors({
    origin: process.env.FRONTEND_BASE_URL,
    exposedHeaders: ["x-auth-token"],
  })
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use("/user", (req, res) => {
  res.send("Hello World");
});

app.use("/gyms", gymRoutes);
app.use("/payments", paymentRoutes);
app.use("/members", memberRoutes);
