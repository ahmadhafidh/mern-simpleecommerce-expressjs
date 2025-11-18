import express from "express";
import {
    addToCart,
    getAllCart,
    updateCart,
    removeFromCart,
    clearCart,
} from "../controllers/cart.controller.js";

import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getAllCart);
router.post("/", addToCart);
router.put("/:id", updateCart);
router.delete("/:id", removeFromCart);
router.delete("/", clearCart);

export default router;