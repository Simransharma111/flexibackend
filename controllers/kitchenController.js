import mongoose from "mongoose";
import Order from "../models/Order.js";
import { io } from "../server.js";

// GET HOTEL ORDERS

// GET HOTEL ORDERS

export const getHotelOrders = async (
  req,
  res
) => {


try{


if(!req.user?.hotelId){

return res.status(403).json({

success:false,

message:"Hotel access denied"

});

}






const {
type,
limit=50
}=req.query;





let filter={

hotelId:req.user.hotelId

};







// =============================
// KITCHEN ORDERS
// =============================

if(type==="kitchen"){


filter.status={

$in:[

"pending",

"accepted",

"preparing",

"ready",

"paused"

]

};


}







// =============================
// HISTORY ORDERS
// =============================


if(type==="history"){


filter.status={

$in:[

"delivered",

"cancelled"

]

};


}









const orders = await Order.find(
filter
)

.sort({

createdAt:-1

})

.limit(
Number(limit)
);








res.json({

success:true,

orders

});



}
catch(error){


console.error(
"Get orders error:",
error
);



res.status(500).json({

success:false,

message:error.message

});


}


};

// UPDATE ORDER STATUS

export const updateOrderStatus = async (
  req,
  res
) => {

try {


const {
  id
} = req.params;


const {
  status,
  pauseReason,
  note
} = req.body;





// VALIDATE ID

if(
!mongoose.Types.ObjectId.isValid(id)
){

return res.status(400).json({

success:false,

message:"Invalid Order ID"

});

}







// HOTEL ACCESS

if(!req.user?.hotelId){

return res.status(403).json({

success:false,

message:"Hotel access denied"

});

}







// ALLOWED STATUS

const allowedStatuses=[

"pending",

"accepted",

"preparing",

"ready",

"delivered",

"paused",

"cancelled"

];



if(
!allowedStatuses.includes(status)
){

return res.status(400).json({

success:false,

message:"Invalid status"

});

}








// FIND ORDER

const order =
await Order.findOne({

_id:id,

hotelId:req.user.hotelId

});





if(!order){

return res.status(404).json({

success:false,

message:"Order not found"

});

}








// ============================
// PAUSE ORDER
// ============================


if(status==="paused"){


order.previousStatus =
order.status;


order.pauseReason =
pauseReason ||
"Kitchen issue";


}







// ============================
// RESUME ORDER
// ============================


if(
order.status==="paused"
&&
status!=="paused"
){


order.previousStatus=null;

order.pauseReason=null;


}








// UPDATE STATUS


order.status=status;







// DELIVERY TIME

if(
status==="delivered"
){

order.deliveredAt =
new Date();

}







// CANCEL TIME

if(
status==="cancelled"
){

order.cancelledAt =
new Date();

order.cancellationReason =
pauseReason ||
note ||
"Cancelled";

}









// STATUS HISTORY


order.statusHistory.push({

status,

changedBy:req.user._id,

note:
note ||
pauseReason ||
null,


changedAt:new Date()

});









await order.save();









// REALTIME EVENTS


io.to(
order.hotelId.toString()
)
.emit(
"kitchenOrderUpdated",
order
);



io.emit(
"orderUpdated",
order
);









return res.json({

success:true,

order

});





}
catch(error){


console.error(
"Update order status error:",
error
);


return res.status(500).json({

success:false,

message:error.message

});


}


};