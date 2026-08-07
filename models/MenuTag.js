import mongoose from "mongoose";

const menuTagSchema=new mongoose.Schema(
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

color:{
type:String,
default:"#f97316"
},

isDefault:{
type:Boolean,
default:false
}

},
{
timestamps:true
}
);

export default mongoose.model(
"MenuTag",
menuTagSchema
);