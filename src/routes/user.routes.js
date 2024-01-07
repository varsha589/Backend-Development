import { Router } from "express";
import { registerUser , loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJwt } from '../middlewares/auth.middleware.js';

const router = Router()

router.route("/register").post(registerUser)


export default router