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
