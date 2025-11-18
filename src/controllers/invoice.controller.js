import prisma from "../config/prisma.js";
import { successResponse, errorResponse } from "../utills/response.js";

// Checkout - Create invoice
export const checkOut = async (req, res) => {
    const { name, email, phone } = req.body;
    const userId = req.user.id;

    if (!name || !email || !phone) {
        return errorResponse(res, 'Name, email, and phone are required', null, 400);
    }

    // Get all cart items
    const carts = await prisma.cart.findMany({
        where: { userId },
        include: {
            product: true
        }
    });

    if (carts.length === 0) {
        return errorResponse(res, 'Cart is empty', null, 400);
    }

    // Check stock availability for all items
    for (const cart of carts) {
        if (cart.product.stock < cart.quantity) {
            return errorResponse(
                res,
                `Insufficient stock for ${cart.product.name}. Available: ${cart.product.stock}`,
                null,
                400
            );
        }
    }

    // Calculate total
    const total = carts.reduce((sum, cart) => sum + cart.total, 0);

    // Prepare items as JSON string
    const items = JSON.stringify(
        carts.map(cart => ({
            productId: cart.productId,
            name: cart.product.name,
            price: cart.product.price,
            quantity: cart.quantity,
            total: cart.total
        }))
    );

    // Create invoice
    const invoice = await prisma.invoice.create({
        data: {
            name,
            email,
            phone,
            items,
            total,
            userId
        }
    });

    // Update product stock
    for (const cart of carts) {
        await prisma.product.update({
            where: { id: cart.productId },
            data: {
                stock: {
                    decrement: cart.quantity
                }
            }
        });
    }

    // Clear cart
    await prisma.cart.deleteMany({
        where: { userId }
    });

    return successResponse(res, 'Invoice created successfully', {
        ...invoice,
        items: JSON.parse(invoice.items)
    });
};

// Get all invoices for logged in user
export const getAllInvoices = async (req, res) => {
    const userId = req.user.id;

    const invoices = await prisma.invoice.findMany({
        where: { userId },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const invoicesWithParsedItems = invoices.map(invoice => ({
        ...invoice,
        items: JSON.parse(invoice.items)
    }));

    return successResponse(res, 'Get invoices successful', invoicesWithParsedItems);
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await prisma.invoice.findFirst({
        where: {
            id,
            userId
        }
    });

    if (!invoice) {
        return errorResponse(res, 'Invoice not found', null, 404);
    }

    return successResponse(res, 'Get invoice successful', {
        ...invoice,
        items: JSON.parse(invoice.items)
    });
};

// Get invoice by user email
export const getInvoiceByUserEmail = async (req, res) => {
    const { email } = req.params;

    const invoices = await prisma.invoice.findMany({
        where: { email },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (invoices.length === 0) {
        return errorResponse(res, 'No invoices found for this email', null, 404);
    }

    const invoicesWithParsedItems = invoices.map(invoice => ({
        ...invoice,
        items: JSON.parse(invoice.items)
    }));

    return successResponse(res, 'Get invoices by email successful', invoicesWithParsedItems);
};
