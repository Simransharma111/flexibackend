import express from "express";

import {
register,
login,
changePassword,
forgotPassword
}
from "../controllers/authController.js";
import auth from "../middlewares/auth.js";


const router =
express.Router();



router.post(
"/register",
register
);


router.post(
"/login",
login
);


router.post(
"/change-password",
auth,
changePassword
);


router.post(
"/forgot-password",
forgotPassword
);



export default router;
