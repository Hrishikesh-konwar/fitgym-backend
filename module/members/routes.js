

import express from "express";
import { validateUser, validateMemberPayload } from "../../middleware/gymMiddleware.js";
import { createMember, getMembers, getMemberById } from "./controller.js";

const router = express.Router();


router.post("/createMembers", validateMemberPayload, validateUser, createMember);

router.get("/getMembers", validateUser, getMembers);

router.get("/getMemberById", validateUser, getMemberById);

// router.put("/updateMember", (req, res) => {
//   res.send("updating member");
// });



export default router;
