import prisma from "../config/prisma.js"
import { successResponse, errorResponse } from "../utills/response.js";



export const getInventories = async (req, res) => {
    const inventories = await prisma.inventory.findMany();
    return successResponse(res, 'get inventory successfull', inventories);
}

export const getInventory = async (req, res) => {
    const {id} = req.params
    const inventory = await prisma.inventory.findUnique({where: {id}});

    if(!inventory) return errorResponse (res, 'Inventory not found', null, 401)

    return successResponse(res, 'get inventory successfull', inventory);
}
export const createInventory = async (req, res) => {
    const {name, description} = req.body
    if(!name || !description) return errorResponse(res, 'You have to insert the name  and description', null, 401);

    const inventory = await prisma.inventory.create(
        {data: {name, description}}
    )
    
    return successResponse(res, 'Inventory Successfully created', inventory)
}

export const updateInventory = async (req, res) => {
    const {id} = req.params

    const {name, description} = req.body
    if(!name || !description) return errorResponse(res, 'You have to insert the name  and description', null, 401);
    
    const inventory = await prisma.inventory.update(
        {
            where:{id},
            data: {name, description}
        }
    )

    return successResponse(res, 'Update successfull', inventory)
}

export const deleteInventory = async (req, res) => {
    const {id} = req.params
    const inventory = await prisma.inventory.delete({where: {id}})

    if(!inventory) return errorResponse(res, 'inventory not found', null, 401)
    
    return successResponse(res, 'inventory deleted', inventory)
}