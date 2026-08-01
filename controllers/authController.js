import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


/*
====================================================
LOGIN
====================================================
*/

export const login = async(req,res)=>{

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




if(!user.password){

return res.status(400).json({

message:"Password not created yet"

});

}




const isMatch =
await bcrypt.compare(
password,
user.password
);



if(!isMatch){

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


// IMPORTANT
mustChangePassword:
user.mustChangePassword,



// IMPORTANT FOR OWNER SETUP

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

console.log(
"LOGIN ERROR",
err
);


res.status(500).json({

message:err.message

});


}


};







/*
====================================================
CHANGE PASSWORD
FIRST LOGIN + NORMAL CHANGE
====================================================
*/


export const changePassword =
async(req,res)=>{


try{


const {

userId,

oldPassword,

newPassword

}=req.body;



const user =
await User.findById(userId);



if(!user){

return res.status(404).json({

message:"User not found"

});

}





const isMatch =
await bcrypt.compare(
oldPassword,
user.password
);



if(!isMatch){

return res.status(400).json({

message:
"Old password incorrect"

});

}





user.password =
await bcrypt.hash(
newPassword,
10
);




// remove first login restriction

user.mustChangePassword=false;



await user.save();



res.json({

message:
"Password changed successfully"

});


}
catch(err){


console.log(
"CHANGE PASSWORD ERROR",
err
);


res.status(500).json({

message:err.message

});


}


};








/*
====================================================
FORGOT PASSWORD
(FUTURE EMAIL OTP READY)
====================================================
*/


export const forgotPassword =
async(req,res)=>{


try{


const {
email
}=req.body;



const user =
await User.findOne({
email
});



if(!user){

return res.status(404).json({

message:"User not found"

});

}



res.json({

message:
"Password reset process started"

});



}
catch(err){


res.status(500).json({

message:err.message

});


}


};