import express from "express";
import { saveSubscription,getVapidKey } from "../controllers/pushController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/subscribe", auth, saveSubscription);
router.get("/push/vapid", getVapidKey);
export default router;