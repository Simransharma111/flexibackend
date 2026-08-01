import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";




/*
=========================================================
CREATE HOTEL + OWNER
Superadmin only
=========================================================
*/


export const createHotelWithOwner =
async(req,res)=>{


try{


const {

hotelName,

address,

phone,

ownerName,

ownerEmail,

ownerPassword


}=req.body;



if(
!hotelName ||
!ownerName ||
!ownerEmail ||
!ownerPassword
){

return res.status(400).json({

message:
"All fields required"

});

}




const existingUser =
await User.findOne({

email:ownerEmail

});



if(existingUser){

return res.status(400).json({

message:
"Owner already exists"

});

}




// HASH TEMP PASSWORD


const hashedPassword =
await bcrypt.hash(
ownerPassword,
10
);






// CREATE OWNER


const owner =
await User.create({

name:ownerName,

email:ownerEmail,

password:hashedPassword,


role:"owner",



// FORCE FIRST PASSWORD CHANGE

mustChangePassword:true

});






// CREATE HOTEL


const hotel =
await Hotel.create({

name:hotelName,

address,

phone,

owner:owner._id,


setupCompleted:false


});






// CONNECT OWNER WITH HOTEL


owner.hotelId =
hotel._id;


await owner.save();






res.status(201).json({

message:
"Hotel created successfully",



owner:{


name:owner.name,

email:owner.email

},


temporaryPassword:
ownerPassword,


hotel

});


}
catch(err){


console.log(
"CREATE HOTEL ERROR",
err
);


res.status(500).json({

message:err.message

});


}


};








/*
=========================================================
GET ALL HOTELS
=========================================================
*/


export const getAllHotels =
async(req,res)=>{


try{


const hotels =
await Hotel.find()

.populate(
"owner",
"name email"
);



res.json(hotels);



}
catch(err){


res.status(500).json({

message:err.message

});


}


};








/*
=========================================================
DELETE HOTEL
=========================================================
*/


export const deleteHotel =
async(req,res)=>{


try{


await Hotel.findByIdAndDelete(
req.params.id
);



res.json({

message:
"Hotel deleted"

});


}
catch(err){


res.status(500).json({

message:err.message

});


}


};