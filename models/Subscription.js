import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  hotelId: String,
  subscription: Object,
});

export default mongoose.model("Subscription", subscriptionSchema);