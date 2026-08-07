import express from "express";

import auth from "../middlewares/auth.js";

import {
getCategories,
createCategory,
deleteCategory,updateCategory
}
from "../controllers/categoryController.js";


const router=express.Router();



router.get(
"/:hotelId",
auth,
getCategories
);



router.post(
"/",
auth,
createCategory
);



router.delete(
"/:id",
auth,
deleteCategory
);

router.put(
"/:id",
auth,
updateCategory
);



export default router;