import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import kitchenRoutes from "./routes/kitchenRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";  
import paymentRoutes from "./routes/paymentRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);


// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
export const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Rate limiting (basic protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  // JOIN ORDER ROOM

  socket.on("joinOrderRoom", (orderId) => {

    socket.join(orderId);

    console.log("Joined Room:", orderId);

  });

  socket.on("disconnect", () => {

    console.log("User Disconnected");

  });

});
// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/table",tableRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/hotel", hotelRoutes);
app.use(
  "/api/notifications",
  notificationRoutes
);
app.use(
  "/api/analytics",
  analyticsRoutes
);
// Connect DB & start server
connectDB().then(() => {
  server.listen(process.env.PORT, () => {
    console.log(`Server running on ${process.env.PORT}`);
  });
});