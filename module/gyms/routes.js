

import express from "express";
import { validateCreateGym, validateLogin, validateUser } from "../../middleware/gymMiddleware.js";
import { createGym, getGymDetials, getDashboardDetails } from "./controller.js";
const router = express.Router();

router.post("/createGym", validateCreateGym, createGym);
router.post("/login", validateLogin, getGymDetials);
router.get("/getDashboardDetails", validateUser, getDashboardDetails )

export default router;
