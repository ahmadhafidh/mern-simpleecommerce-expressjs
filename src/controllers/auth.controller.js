import prisma from "../config/prisma.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "../utills/response.js";
import { cookieOptions } from "../utills/cookieOption.js";


const JWT_SECRET = process.env.JWT_SECRET 


// register
export const register = async (req, res) => {
    const {name, email, password} = req.body;
    //cek email
    const emailExisted = await prisma.user.findUnique({
        where:{
            email
        }
    });

    if(emailExisted) return errorResponse(res,'email allready in use', null, 400)
    //hash password
    const hashed = await bcrypt.hash(password, 10)

    //simpan user baru ke database
    const user = await prisma.user.create({
        data:{
            name,
            email,
            password: hashed
        }
    });

    return successResponse(res, 'Register Successfull',{
         id: user.id,
         name: user.name,
         email: user.email
    });
}


// login
export const login = async (req, res) => {
    const {email, password} = req.body;

    const user  = await prisma.user.findUnique({where:{email}})
    if(!user) return errorResponse(res, 'User not found', null, 401);

    const match = await bcrypt.compare(password, user.password);
    if(!match) return errorResponse(res, 'Invalid password', null, 401);

    //buat jwt token
    const token = jwt.sign({id: user.id}, JWT_SECRET, {expiresIn: "1d"} ) 

    res.cookie("token", token, cookieOptions(req))

    return successResponse(res, "Login Successfull",{
        userId: user.id,
        email: email,
        token: token,
    })

}


//logout
export const logout = async (req,res) => {
    res.clearCookie("token", {
        ...cookieOptions(req),
        maxAge: undefined,
    })
    return successResponse(res, "logout successfull",)
}