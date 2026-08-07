import MenuCategory from "../models/MenuCategory.js";


export const getCategories = async(req,res)=>{

try{

const categories = await MenuCategory.find({
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



export const createCategory = async(req,res)=>{

try{

const {
name,
hotelId
}=req.body;


const exists = await MenuCategory.findOne({
hotelId,
name
});


if(exists){

return res.status(400).json({
message:"Category already exists"
});

}


const category =
await MenuCategory.create({
hotelId,
name
});


res.status(201).json(category);


}
catch(error){

res.status(500).json({
message:error.message
});

}

};



export const deleteCategory = async(req,res)=>{

try{


await MenuCategory.findByIdAndDelete(
req.params.id
);


res.json({
message:"Deleted"
});


}
catch(error){

res.status(500).json({
message:error.message
});

}

};
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



if(!category){

return res.status(404).json({
message:"Category not found"
});

}


res.json(category);



}
catch(error){

res.status(500).json({
message:error.message
});

}


};




