import mongoose from "mongoose";


const menuSchema = new mongoose.Schema(

{

// Restaurant

hotelId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Hotel",
required:true
},


// Category Reference

categoryId:{
type:mongoose.Schema.Types.ObjectId,
ref:"MenuCategory",
required:true
},


// Optional Sub Category

subCategory:{
type:String,
default:"",
trim:true
},


// Dish Information

name:{
type:String,
required:true,
trim:true
},


description:{
type:String,
default:""
},


image:{
type:String,
default:""
},


// Pricing

price:{
type:Number,
required:true,
min:0
},


prepTime:{
type:Number,
default:15
},


// Food Type

foodType:{
type:String,
enum:[
"veg",
"nonveg"
],
default:"veg"
},


// Availability

isAvailable:{
type:Boolean,
default:true
},


// Featured Menu

featured:{
type:Boolean,
default:false
},


todaySpecial:{
type:Boolean,
default:false
},


isRecommended:{
type:Boolean,
default:false
},


isBestseller:{
type:Boolean,
default:false
},


isPopular:{
type:Boolean,
default:false
},


isNewArrival:{
type:Boolean,
default:false
},


chefChoice:{
type:Boolean,
default:false
},


// Custom Tags

tags:{
type:[String],
default:[]
},


// Spice

spiceLevel:{
type:String,
enum:[
"mild",
"medium",
"hot",
""
],
default:""
},


// GST Override (future)

gst:{
type:Number,
default:null
},


// Display Sorting

displayOrder:{
type:Number,
default:0
},


// Soft Delete

isDeleted:{
type:Boolean,
default:false
},


// Scheduled Menu

isScheduled:{
type:Boolean,
default:false
},


scheduledFor:{
type:Date,
default:null
}


},

{
timestamps:true
}

);



// Faster menu loading

menuSchema.index({
hotelId:1,
categoryId:1
});


export default mongoose.model(
"Menu",
menuSchema
);