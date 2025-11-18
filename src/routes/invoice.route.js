import express from "express";
import {
    checkOut,
    getAllInvoices,
    getInvoiceById,
    getInvoiceByUserEmail,
} from "../controllers/invoice.controller.js";

import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getAllInvoices);
router.get("/:id", getInvoiceById);
router.get("/email/:email", getInvoiceByUserEmail);
router.post("/checkout", checkOut);

export default router;
