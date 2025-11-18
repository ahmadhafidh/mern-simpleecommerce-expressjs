import prisma from "../config/prisma.js";
import { successResponse, errorResponse } from "../utills/response.js";
import fs from "fs";
import path from "path";

// Get all products
export const getAllProducts = async (req, res) => {
    const products = await prisma.product.findMany({
        include: {
            inventory: true
        }
    });

    const productsWithUrl = products.map(product => ({
        ...product,
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/${product.image}`
    }));

    return successResponse(res, 'Get all products successful', productsWithUrl);
};

// Get product by ID
export const getProductById = async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            inventory: true
        }
    });

    if (!product) return errorResponse(res, 'Product not found', null, 404);

    const productWithUrl = {
        ...product,
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/${product.image}`
    };

    return successResponse(res, 'Get product successful', productWithUrl);
};

// Get products by inventory ID
export const getProductByInventoryId = async (req, res) => {
    const { inventoryId } = req.params;

    const products = await prisma.product.findMany({
        where: { inventoryId },
        include: {
            inventory: true
        }
    });

    const productsWithUrl = products.map(product => ({
        ...product,
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/${product.image}`
    }));

    return successResponse(res, 'Get products by inventory successful', productsWithUrl);
};

// Create product
export const createProduct = async (req, res) => {
    const { name, price, stock, description, inventoryId } = req.body;

    if (!name || !price || !stock || !description || !inventoryId) {
        return errorResponse(res, 'All fields are required', null, 400);
    }

    if (!req.file) {
        return errorResponse(res, 'Image is required', null, 400);
    }

    // Check if inventory exists
    const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId }
    });

    if (!inventory) {
        // Delete uploaded file if inventory not found
        fs.unlinkSync(req.file.path);
        return errorResponse(res, 'Inventory not found', null, 404);
    }

    const product = await prisma.product.create({
        data: {
            name,
            image: req.file.filename,
            price: parseInt(price),
            stock: parseInt(stock),
            description,
            inventoryId
        },
        include: {
            inventory: true
        }
    });

    const productWithUrl = {
        ...product,
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/${product.image}`
    };

    return successResponse(res, 'Product created successfully', productWithUrl);
};

// Update product
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, description, inventoryId } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 'Product not found', null, 404);
    }

    // If inventoryId provided, check if it exists
    if (inventoryId) {
        const inventory = await prisma.inventory.findUnique({
            where: { id: inventoryId }
        });

        if (!inventory) {
            if (req.file) fs.unlinkSync(req.file.path);
            return errorResponse(res, 'Inventory not found', null, 404);
        }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = parseInt(price);
    if (stock) updateData.stock = parseInt(stock);
    if (description) updateData.description = description;
    if (inventoryId) updateData.inventoryId = inventoryId;

    // If new image uploaded, delete old image and update
    if (req.file) {
        const oldImagePath = path.join('uploads', product.image);
        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
        }
        updateData.image = req.file.filename;
    }

    const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
            inventory: true
        }
    });

    const productWithUrl = {
        ...updatedProduct,
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/${updatedProduct.image}`
    };

    return successResponse(res, 'Product updated successfully', productWithUrl);
};

// Delete product
export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
        return errorResponse(res, 'Product not found', null, 404);
    }

    // Delete image file
    const imagePath = path.join('uploads', product.image);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    await prisma.product.delete({ where: { id } });

    return successResponse(res, 'Product deleted successfully', null);
};
