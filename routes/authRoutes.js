import express from "express";

import {
login,
changePassword,
forgotPassword
}
from "../controllers/authController.js";


const router =
express.Router();



router.post(
"/login",
login
);


router.post(
"/change-password",
changePassword
);


router.post(
"/forgot-password",
forgotPassword
);



export default router;
