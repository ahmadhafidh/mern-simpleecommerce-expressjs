import express from "express"
import { upload } from "../middlewares/upload.js"
import { verifyToken } from "../middlewares/verifyToken.js"

import {
    createProduct,
    getAllProducts,
    getProductByInventoryId,
    getProductById,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js"

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/inventory/:inventoryId", getProductByInventoryId);
router.post("/", upload.single('image'), createProduct);
router.put("/:id", upload.single('image'), updateProduct);
router.delete("/:id", deleteProduct);

export default router;

