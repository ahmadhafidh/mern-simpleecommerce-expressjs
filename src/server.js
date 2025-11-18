import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";

//load env
dotenv.config({ path: '.env' });

const app = express();

import authRoutes from "./routes/auth.route.js"
import inventoryRoutes from "./routes/inventory.route.js"
import productRoutes from "./routes/product.route.js"
import cartRoutes from "./routes/cart.route.js"
import invoiceRoutes from "./routes/invoice.route.js"
import statisticRoutes from "./routes/statistic.route.js"

const PORT = process.env.APP_PORT || 5000;

//middlewares
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/statistics", statisticRoutes);

app.listen(PORT, () => {
    console.log(`server up and running at PORT ${PORT}`);
}); 