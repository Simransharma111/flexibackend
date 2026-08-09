import express from "express";

import {
register,
login,
changePassword
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



// router.post(
// "/forgot-password",
// forgotPassword
// );

// router.post(
//   "/reset-password/:token",
//   resetPassword
// );

export default router;
