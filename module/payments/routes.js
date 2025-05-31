import express from "express";
import { validatePayment, validateUser } from "../../middleware/gymMiddleware.js";

import { createPayments, getPayments, getPaymentsByGym, seed } from './controller.js'

const router = express.Router();

router.get("/getPayments", validateUser, getPayments);
router.get('/getPaymentsByGym', validateUser, getPaymentsByGym)

router.post("/createPayments", validatePayment, validateUser, createPayments);

router.post('/seed', seed)



export default router;
