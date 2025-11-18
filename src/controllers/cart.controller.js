import prisma from "../config/prisma.js";
import { successResponse, errorResponse } from "../utills/response.js";

// Add to cart
export const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    if (!productId || !quantity) {
        return errorResponse(res, 'Product ID and quantity are required', null, 400);
    }

    if (quantity <= 0) {
        return errorResponse(res, 'Quantity must be greater than 0', null, 400);
    }

    // Check if product exists and has enough stock
    const product = await prisma.product.findUnique({
        where: { id: productId }
    });

    if (!product) {
        return errorResponse(res, 'Product not found', null, 404);
    }

    if (product.stock < quantity) {
        return errorResponse(res, `Insufficient stock. Available: ${product.stock}`, null, 400);
    }

    // Calculate total
    const total = product.price * quantity;

    // Check if product already in cart
    const existingCart = await prisma.cart.findFirst({
        where: {
            userId,
            productId
        }
    });

    let cart;
    if (existingCart) {
        // Update existing cart
        const newQuantity = existingCart.quantity + quantity;
        
        if (product.stock < newQuantity) {
            return errorResponse(res, `Insufficient stock. Available: ${product.stock}`, null, 400);
        }

        cart = await prisma.cart.update({
            where: { id: existingCart.id },
            data: {
                quantity: newQuantity,
                total: product.price * newQuantity
            },
            include: {
                product: {
                    include: {
                        inventory: true
                    }
                }
            }
        });
    } else {
        // Create new cart item
        cart = await prisma.cart.create({
            data: {
                productId,
                quantity,
                total,
                userId
            },
            include: {
                product: {
                    include: {
                        inventory: true
                    }
                }
            }
        });
    }

    const cartWithUrl = {
        ...cart,
        product: {
            ...cart.product,
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/${cart.product.image}`
        }
    };

    return successResponse(res, 'Product added to cart successfully', cartWithUrl);
};

// Get all cart items for logged in user
export const getAllCart = async (req, res) => {
    const userId = req.user.id;

    const carts = await prisma.cart.findMany({
        where: { userId },
        include: {
            product: {
                include: {
                    inventory: true
                }
            }
        }
    });

    const cartsWithUrl = carts.map(cart => ({
        ...cart,
        product: {
            ...cart.product,
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/${cart.product.image}`
        }
    }));

    // Calculate grand total
    const grandTotal = carts.reduce((sum, cart) => sum + cart.total, 0);

    return successResponse(res, 'Get cart successful', {
        items: cartsWithUrl,
        grandTotal
    });
};

// Update cart quantity
export const updateCart = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity <= 0) {
        return errorResponse(res, 'Quantity must be greater than 0', null, 400);
    }

    const cart = await prisma.cart.findFirst({
        where: {
            id,
            userId
        },
        include: {
            product: true
        }
    });

    if (!cart) {
        return errorResponse(res, 'Cart item not found', null, 404);
    }

    if (cart.product.stock < quantity) {
        return errorResponse(res, `Insufficient stock. Available: ${cart.product.stock}`, null, 400);
    }

    const updatedCart = await prisma.cart.update({
        where: { id },
        data: {
            quantity,
            total: cart.product.price * quantity
        },
        include: {
            product: {
                include: {
                    inventory: true
                }
            }
        }
    });

    const cartWithUrl = {
        ...updatedCart,
        product: {
            ...updatedCart.product,
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/${updatedCart.product.image}`
        }
    };

    return successResponse(res, 'Cart updated successfully', cartWithUrl);
};

// Remove from cart
export const removeFromCart = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const cart = await prisma.cart.findFirst({
        where: {
            id,
            userId
        }
    });

    if (!cart) {
        return errorResponse(res, 'Cart item not found', null, 404);
    }

    await prisma.cart.delete({
        where: { id }
    });

    return successResponse(res, 'Item removed from cart successfully', null);
};

// Clear all cart items for user
export const clearCart = async (req, res) => {
    const userId = req.user.id;

    await prisma.cart.deleteMany({
        where: { userId }
    });

    return successResponse(res, 'Cart cleared successfully', null);
};
