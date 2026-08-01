import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";


/*
=========================================================
CREATE HOTEL + OWNER
Superadmin only

Supports:
1. Old method:
   Superadmin gives password

2. New method:
   Owner creates password from setup link
=========================================================
*/

export const createHotelWithOwner = async (req, res) => {

  try {

    const {
      hotelName,
      address,
      phone,
      ownerName,
      ownerEmail,
      ownerPassword
    } = req.body;



    // VALIDATION

    if(
      !hotelName ||
      !ownerName ||
      !ownerEmail
    ){

      return res.status(400).json({

        message:
        "All required fields are needed"

      });

    }



    // CHECK EXISTING USER

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



    let password = null;

    let passwordSetupToken = null;

    let passwordSetupExpires = null;



    /*
    =====================================================
    IF SUPERADMIN PROVIDES PASSWORD
    =====================================================
    */

    if(ownerPassword){


      password =
      await bcrypt.hash(
        ownerPassword,
        10
      );


    }


    /*
    =====================================================
    OTHERWISE CREATE SETUP LINK
    =====================================================
    */


    else{


      passwordSetupToken =
      crypto
      .randomBytes(32)
      .toString("hex");



      passwordSetupExpires =
      Date.now()
      +
      24 * 60 * 60 * 1000;


    }




    // CREATE OWNER


    const owner =
    await User.create({

      name:ownerName,

      email:ownerEmail,

      password,

      role:"owner",

      passwordSetupToken,

      passwordSetupExpires

    });






    // CREATE HOTEL


    const hotel =
    await Hotel.create({

      name:hotelName,

      address,

      phone,

      owner:owner._id

    });






    // LINK HOTEL


    owner.hotelId =
    hotel._id;


    await owner.save();






    // CREATE SETUP LINK ONLY IF REQUIRED


    let setupLink = null;



    if(passwordSetupToken){


      setupLink =
      `${process.env.FRONTEND_URL}/setup-password?token=${passwordSetupToken}`;


    }







    res.status(201).json({

      message:
      "Hotel created successfully",


      hotel:{


        id:hotel._id,

        name:hotel.name


      },


      owner:{


        id:owner._id,

        name:owner.name,

        email:owner.email


      },


      setupLink


    });



  }
  catch(err){


    console.log(
      "CREATE HOTEL ERROR:",
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


export const getAllHotels = async(req,res)=>{


try{


const hotels =
await Hotel.find()

.populate(
"owner",
"name email"
)

.sort({
createdAt:-1
});



res.json(hotels);



}
catch(err){


console.log(err);


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


export const deleteHotel = async(req,res)=>{


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