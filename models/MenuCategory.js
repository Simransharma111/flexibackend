import mongoose from "mongoose";

const menuCategorySchema = new mongoose.Schema(
{
  hotelId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Hotel",
    required:true
  },

  name:{
    type:String,
    required:true,
    trim:true
  },

  displayOrder:{
    type:Number,
    default:0
  },

  isActive:{
    type:Boolean,
    default:true
  }

},
{
  timestamps:true
}
);


export default mongoose.model(
"MenuCategory",
menuCategorySchema
);