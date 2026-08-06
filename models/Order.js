import mongoose from "mongoose";


const orderSchema = new mongoose.Schema(

{
  // HOTEL
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },


  // TABLE REFERENCE
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
  },


  // BACKWARD COMPATIBILITY
  roomNumber: {
    type: String,
    required: true,
  },


  // TABLE / ROOM NUMBER
  locationNumber: {
    type: String,
  },


  locationType: {
    type: String,
    enum: [
      "table",
      "room"
    ],
    default: "table",
  },



  // GUEST DETAILS
  guestName: {
    type: String,
    default: "Guest",
  },



  // ORDER ITEMS
  items: [

    {

      menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
      },


      name: {
        type:String,
      },


      quantity: {
        type:Number,
        default:1,
      },


      price:{
        type:Number,
        default:0,
      },


      total:{
        type:Number,
        default:0,
      }

    }

  ],





  // BILLING

  subtotal:{
    type:Number,
    default:0,
  },


  gstAmount:{
    type:Number,
    default:0,
  },


  serviceCharge:{
    type:Number,
    default:0,
  },


  discountAmount:{
    type:Number,
    default:0,
  },


  totalAmount:{
    type:Number,
    required:true,
  },





  // PAYMENT

  paymentStatus:{
    type:String,

    enum:[
      "pending",
      "paid"
    ],

    default:"pending",
  },


  paymentMethod:{
    type:String,

    enum:[
      "cash",
      "online",
      "card"
    ],

    default:"cash",
  },



  billGenerated:{
    type:Boolean,
    default:false,
  },


  billNumber:{
    type:String,
  },







  // ORDER ESTIMATION

  estimatedTime:{
    type:Number,
    default:20,
  },






  // ORDER TYPE

  orderType:{

    type:String,

    enum:[
      "now",
      "schedule"
    ],

    default:"now",

  },


  scheduledFor:{
    type:Date,
    default:null,
  },









  // ===============================
  // KITCHEN STATUS MANAGEMENT
  // ===============================


  status:{

    type:String,

    enum:[

      "pending",

      "accepted",

      "preparing",

      "ready",

      "delivered",

      "paused",

      "cancelled"

    ],


    default:"pending",

  },




  // Used when order is paused
  // Example:
  // preparing -> paused -> preparing

  previousStatus:{

    type:String,

    default:null,

  },





  pauseReason:{

    type:String,

    default:null,

  },








  // STATUS HISTORY

  statusHistory:[

    {

      status:{

        type:String,

      },


      changedBy:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

      },


      note:String,


      changedAt:{

        type:Date,

        default:Date.now,

      }

    }

  ],







  // COMPLETION

  deliveredAt:{
    type:Date,
  },



  cancelledAt:{
    type:Date,
  },


  cancellationReason:{
    type:String,
  },


},


{
  timestamps:true,
}

);



export default mongoose.model(
"Order",
orderSchema
);