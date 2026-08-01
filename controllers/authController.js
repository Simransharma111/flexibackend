import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";





/*
=================================================
SETUP PASSWORD
=================================================
*/


export const setupPassword = async(req,res)=>{


try{


const {
token,
password
}=req.body;



if(!token || !password){

return res.status(400).json({

message:
"Token and password required"

});

}




const user =
await User.findOne({

passwordSetupToken:token,

passwordSetupExpires:{
$gt:Date.now()
}

});




if(!user){

return res.status(400).json({

message:
"Invalid or expired setup link"

});

}




user.password =
await bcrypt.hash(
password,
10
);



user.passwordSetupToken=null;

user.passwordSetupExpires=null;



await user.save();




res.json({

message:
"Password created successfully"

});



}
catch(err){


console.log(
"SETUP PASSWORD ERROR",
err
);


res.status(500).json({

message:err.message

});


}


};








/*
=================================================
LOGIN
=================================================
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

message:
"Invalid credentials"

});

}





// NEW USER WITHOUT PASSWORD


if(!user.password){


return res.status(403).json({

message:
"Please setup your password first",

setupRequired:true

});


}






const isMatch =
await bcrypt.compare(
password,
user.password
);




if(!isMatch){


return res.status(400).json({

message:
"Invalid credentials"

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
"LOGIN ERROR:",
err
);


res.status(500).json({

message:err.message

});


}


};