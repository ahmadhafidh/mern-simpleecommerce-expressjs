import express from "express"
import {
    getInventories,
    getInventory,
    createInventory,
    updateInventory,
    deleteInventory,
} from "../controllers/inventory.controller.js";

import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();



router.use(verifyToken)

router.get("/", getInventories)
router.get("/:id", getInventory)
router.post("/", createInventory)
router.delete("/:id", deleteInventory)
router.put("/:id", updateInventory)




export default router;