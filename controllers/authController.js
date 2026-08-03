import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



export const register =
async(req,res)=>{

try{

const {
name,
email,
password
}=req.body;


if(!name || !email || !password){

return res.status(400).json({
message:"Name, email and password are required"
});

}


const existingUser =
await User.findOne({
email
});


if(existingUser){

return res.status(400).json({
message:"User already exists"
});

}


const hashedPassword =
await bcrypt.hash(
password,
10
);


const user =
await User.create({
name,
email,
password:hashedPassword,
role:"owner",
accountStatus:"pending",
subscriptionPlan:"trial",
createdBy:"self"
});


const token =
jwt.sign(
{
id:user._id,
role:user.role,
hotelId:user.hotelId?._id
},
process.env.JWT_SECRET,
{
expiresIn:"7d"
}
);


res.status(201).json({
message:"Owner registration successful",
token,
user:{
id:user._id,
name:user.name,
email:user.email,
role:user.role,
accountStatus:user.accountStatus,
subscriptionPlan:user.subscriptionPlan,
createdBy:user.createdBy
}
});

}
catch(err){

console.log(err);


res.status(500).json({
message:err.message
});

}

};


export const login =
async(req,res)=>{


try{


const {
email,
password
}=req.body;



const user =
await User.findOne({
email
})
.populate("hotelId");



if(!user){

return res.status(400).json({
message:"Invalid credentials"
});

}




const match =
await bcrypt.compare(
password,
user.password
);



if(!match){

return res.status(400).json({
message:"Invalid credentials"
});

}





const token =
jwt.sign(

{
id:user._id,
role:user.role,
hotelId:user.hotelId?._id
},

process.env.JWT_SECRET,

{
expiresIn:"7d"
}

);





res.json({

token,


mustChangePassword:
user.mustChangePassword,


hotelSetupCompleted:
user.hotelId?.setupCompleted || false,


user:{

id:user._id,

name:user.name,

email:user.email,

role:user.role,

hotel:user.hotelId

}


});


}
catch(err){

console.log(err);


res.status(500).json({
message:err.message
});


}


};








// CHANGE PASSWORD

export const changePassword =
async(req,res)=>{

try{


const {
oldPassword,
newPassword
}=req.body;



const user =
await User.findById(
req.user.id
);



if(!user){

return res.status(404).json({
message:"User not found"
});

}




const match =
await bcrypt.compare(
oldPassword,
user.password
);



if(!match){

return res.status(400).json({
message:"Old password incorrect"
});

}




user.password =
await bcrypt.hash(
newPassword,
10
);



user.mustChangePassword=false;


await user.save();



res.json({

message:
"Password changed successfully",


hotelSetupCompleted:
user.hotelId?.setupCompleted || false

});


}
catch(err){

res.status(500).json({
message:err.message
});


}

};







export const forgotPassword =
async(req,res)=>{


res.json({

message:
"Forgot password system coming soon"

});


};