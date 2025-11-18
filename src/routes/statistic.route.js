import express from "express";
import { getRange, getSingle } from "../controllers/statistic.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.use(verifyToken);

router.get("/range", getRange);
router.get("/single", getSingle);

export default router;
