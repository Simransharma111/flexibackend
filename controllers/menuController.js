import MenuCategory from "../models/MenuCategory.js";
import Menu from "../models/Menu.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";
import Table from "../models/Table.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// CREATE CATEGORY

export const createCategory = async (req, res) => {
  try {
    const { name, hotelId, parentCategory } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Category name required"
      });
    }

    const finalHotelId = req.user?.hotelId || hotelId;

    if (!finalHotelId) {
      return res.status(400).json({
        message: "Hotel ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(finalHotelId)) {
      return res.status(400).json({
        message: "Invalid Hotel ID"
      });
    }

    const exists = await MenuCategory.findOne({
      hotelId: finalHotelId,
      name: name.trim()
    });

    if (exists) {
      return res.status(400).json({
        message: "Category already exists"
      });
    }

    const category = await MenuCategory.create({
      hotelId: finalHotelId,
      name: name.trim(),
      parentCategory: parentCategory || null
    });

    res.status(201).json(category);

  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// ================================
// GET CATEGORIES
// ================================

export const getCategories = async(req,res)=>{

try{


const categories =
await MenuCategory.find({

hotelId:req.params.hotelId,

isActive:true

})
.sort({

displayOrder:1

});



res.json(categories);


}
catch(error){

res.status(500).json({

message:error.message

});

}

};



// ================================
// UPDATE CATEGORY
// ================================


export const updateCategory = async(req,res)=>{

try{


const category =
await MenuCategory.findByIdAndUpdate(

req.params.id,

{
name:req.body.name
},

{
new:true
}

);



res.json(category);


}
catch(error){

res.status(500).json({

message:error.message

});

}

};



// ================================
// DELETE CATEGORY
// ================================


export const deleteCategory = async(req,res)=>{

try{


await MenuCategory.findByIdAndUpdate(

req.params.id,

{
isActive:false
}

);



res.json({

message:"Category disabled"

});


}
catch(error){

res.status(500).json({

message:error.message

});

}

};

// ADD DISH


export const addDish = async(req,res)=>{

try{


const {

categoryId,

subCategory,

name,

description,

price,

prepTime,

foodType,

isAvailable,

featured,

todaySpecial,

isRecommended,

isBestseller,

isPopular,

isNewArrival,

chefChoice,

spiceLevel,

tags,

scheduledFor


}=req.body;



// CATEGORY CHECK

const category =
await MenuCategory.findOne({

_id:categoryId,

hotelId:req.user.hotelId

});


if(!category){

return res.status(400).json({

message:"Invalid category"

});

}




// IMAGE

let image="";


if(req.file){

const result =
await uploadToCloudinary(

req.file.buffer,

"menu"

);


image=result.secure_url;

}



// CREATE DISH


const dish =
await Menu.create({

hotelId:req.user.hotelId,


categoryId,


subCategory:
subCategory || "",


name,


description,


price:Number(price),


prepTime:
Number(prepTime || 15),



foodType:
foodType || "veg",



image,



isAvailable:
req.body.isAvailable === true ||
req.body.isAvailable === "true",



isAvailable:
req.body.isAvailable === true ||
req.body.isAvailable === "true",



isAvailable:
req.body.isAvailable === true ||
req.body.isAvailable === "true",


isAvailable:
req.body.isAvailable === true ||
req.body.isAvailable === "true",



isAvailable:
req.body.isAvailable === true ||
req.body.isAvailable === "true",



isAvailable:
req.body.isAvailable === true ||
req.body.isAvailable === "true",



isAvailable:
req.body.isAvailable === true ||
req.body.isAvailable === "true",



chefChoice:
req.body.chefChoice === true ||
req.body.chefChoice === "true",



spiceLevel:
spiceLevel || "",



tags:
tags
?
(
Array.isArray(tags)
?
tags
:
tags.split(",")
.map(t=>t.trim())
)
:
[],



isScheduled:
!!scheduledFor,


scheduledFor:
scheduledFor || null



});



const populatedDish =
await dish.populate(
"categoryId"
);



res.status(201).json(
populatedDish
);


}

catch(error){

console.log(error);


res.status(500).json({

message:error.message

});

}


};
export const getHotelMenu = async(req,res)=>{

try{


const {hotelId}=req.params;



if(
!mongoose.Types.ObjectId.isValid(hotelId)
){

return res.status(400).json({

message:"Invalid Hotel ID"

});

}



// GET MENU

const dishes = await Menu.find({

hotelId,


})

.populate({

path:"categoryId",

select:"name displayOrder isActive"

})


.sort({

displayOrder:1,

createdAt:-1

});



res.status(200).json(
dishes
);



}
catch(error){

console.log(
"GET MENU ERROR:",
error
);



res.status(500).json({

message:error.message

});


}


};
// UPDATE DISH
export const updateDish = async(req,res)=>{

try{


const dish =
await Menu.findById(
req.params.id
);



if(!dish){

return res.status(404).json({

message:"Dish not found"

});

}



// CATEGORY CHANGE CHECK

if(req.body.categoryId){


const category =
await MenuCategory.findOne({

_id:req.body.categoryId,

hotelId:req.user.hotelId

});


if(!category){

return res.status(400).json({

message:"Invalid category"

});

}


}




const updateData={

...req.body,


price:
Number(req.body.price),


prepTime:
Number(req.body.prepTime || 15),



isAvailable:
req.body.isAvailable==="true",


featured:
req.body.featured==="true",


todaySpecial:
req.body.todaySpecial==="true",


isRecommended:
req.body.isRecommended==="true",


isBestseller:
req.body.isBestseller==="true",


isPopular:
req.body.isPopular==="true",


isNewArrival:
req.body.isNewArrival==="true",


chefChoice:
req.body.chefChoice==="true",



tags:
req.body.tags
?
(
Array.isArray(req.body.tags)
?
req.body.tags
:
req.body.tags.split(",")
.map(t=>t.trim())
)
:
[]



};




// IMAGE UPDATE

if(req.file){


const result =
await uploadToCloudinary(

req.file.buffer,

"menu"

);


updateData.image =
result.secure_url;


}




const updatedDish =

await Menu.findByIdAndUpdate(

req.params.id,

updateData,

{
new:true
}

).populate(
"categoryId"
);



res.json(
updatedDish
);



}
catch(error){


console.log(error);


res.status(500).json({

message:error.message

});


}


};

// DELETE DISH

export const deleteDish = async(req,res)=>{

try{


const dish =
await Menu.findByIdAndUpdate(

req.params.id,

{
isDeleted:true,
isAvailable:false
},

{
new:true
}

);



if(!dish){

return res.status(404).json({

message:"Dish not found"

});

}



res.json({

message:"Dish moved to deleted",

dish

});


}
catch(error){

res.status(500).json({

message:error.message

});

}

};


export const getMenuByTable = async(req,res)=>{

try{


const {tableId}=req.params;


let table=null;



if(
mongoose.Types.ObjectId.isValid(tableId)
){

table =
await Table.findById(tableId);

}



if(!table){

table =
await Table.findOne({
qrId:tableId
});

}



if(!table){

return res.status(404).json({

message:"Table not found"

});

}



const dishes = await Menu.find({

hotelId:table.hotelId,

isAvailable:true,

isDeleted:false

})


.populate({

path:"categoryId",

select:"name"

})


.sort({

displayOrder:1,

createdAt:-1

});




res.json({

success:true,

table,

dishes

});


}
catch(error){

res.status(500).json({

message:error.message

});

}

};
export const getFeaturedMenu = async(req,res)=>{

try{


const dishes =
await Menu.find({

hotelId:req.params.hotelId,

isAvailable:true,

isDeleted:false

})


.populate({

path:"categoryId",

select:"name"

});



res.json({

todaySpecial:
dishes.filter(
d=>d.todaySpecial
),


recommended:
dishes.filter(
d=>d.isRecommended
),


popular:
dishes.filter(
d=>d.isPopular
),


bestSeller:
dishes.filter(
d=>d.isBestseller
),


newArrival:
dishes.filter(
d=>d.isNewArrival
),


featured:
dishes.filter(
d=>d.featured
),


all:dishes

});


}
catch(error){

res.status(500).json({

message:error.message

});

}

};