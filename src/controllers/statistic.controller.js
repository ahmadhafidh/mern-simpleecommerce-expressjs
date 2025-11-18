import prisma from "../config/prisma.js";
import { successResponse, errorResponse } from "../utills/response.js";

// Get statistics for a date range
export const getRange = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return errorResponse(res, 'Start date and end date are required', null, 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return errorResponse(res, 'Invalid date format', null, 400);
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Get invoices in date range
    const invoices = await prisma.invoice.findMany({
        where: {
            createdAt: {
                gte: start,
                lte: end
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Calculate statistics
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Get top products from invoices
    const productStats = {};
    invoices.forEach(invoice => {
        const items = JSON.parse(invoice.items);
        items.forEach(item => {
            if (!productStats[item.productId]) {
                productStats[item.productId] = {
                    productId: item.productId,
                    name: item.name,
                    totalQuantity: 0,
                    totalRevenue: 0
                };
            }
            productStats[item.productId].totalQuantity += item.quantity;
            productStats[item.productId].totalRevenue += item.total;
        });
    });

    const topProducts = Object.values(productStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

    // Get daily revenue breakdown
    const dailyRevenue = {};
    invoices.forEach(invoice => {
        const date = invoice.createdAt.toISOString().split('T')[0];
        if (!dailyRevenue[date]) {
            dailyRevenue[date] = {
                date,
                revenue: 0,
                orders: 0
            };
        }
        dailyRevenue[date].revenue += invoice.total;
        dailyRevenue[date].orders += 1;
    });

    const dailyRevenueArray = Object.values(dailyRevenue).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    return successResponse(res, 'Get range statistics successful', {
        period: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        },
        summary: {
            totalInvoices,
            totalRevenue,
            averageOrderValue: Math.round(averageOrderValue)
        },
        topProducts,
        dailyRevenue: dailyRevenueArray,
        recentInvoices: invoices.slice(0, 10).map(invoice => ({
            ...invoice,
            items: JSON.parse(invoice.items)
        }))
    });
};

// Get single day statistics
export const getSingle = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return errorResponse(res, 'Date is required', null, 400);
    }

    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
        return errorResponse(res, 'Invalid date format', null, 400);
    }

    // Set date range for the single day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get invoices for the day
    const invoices = await prisma.invoice.findMany({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Calculate statistics
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Get product stats for the day
    const productStats = {};
    invoices.forEach(invoice => {
        const items = JSON.parse(invoice.items);
        items.forEach(item => {
            if (!productStats[item.productId]) {
                productStats[item.productId] = {
                    productId: item.productId,
                    name: item.name,
                    totalQuantity: 0,
                    totalRevenue: 0
                };
            }
            productStats[item.productId].totalQuantity += item.quantity;
            productStats[item.productId].totalRevenue += item.total;
        });
    });

    const topProducts = Object.values(productStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

    // Get hourly breakdown
    const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        revenue: 0,
        orders: 0
    }));

    invoices.forEach(invoice => {
        const hour = invoice.createdAt.getHours();
        hourlyStats[hour].revenue += invoice.total;
        hourlyStats[hour].orders += 1;
    });

    return successResponse(res, 'Get single day statistics successful', {
        date: targetDate.toISOString().split('T')[0],
        summary: {
            totalInvoices,
            totalRevenue,
            averageOrderValue: Math.round(averageOrderValue)
        },
        topProducts,
        hourlyBreakdown: hourlyStats.filter(h => h.orders > 0),
        invoices: invoices.map(invoice => ({
            ...invoice,
            items: JSON.parse(invoice.items)
        }))
    });
};
