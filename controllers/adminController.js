import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";



// CREATE HOTEL + OWNER

export const createHotelWithOwner =
  async (req, res) => {

    try {

      console.log(req.body);

      const {
        hotelName,
        address,
        phone,
        ownerName,
        ownerEmail,
        ownerPassword,
      } = req.body;

      // VALIDATION

      if (
        !hotelName ||
        !ownerName ||
        !ownerEmail ||
        !ownerPassword
      ) {
        return res
          .status(400)
          .json(
            "All required fields are needed"
          );
      }

      // CHECK EXISTING USER

      const existingUser =
        await User.findOne({
          email: ownerEmail,
        });

      if (existingUser) {
        return res
          .status(400)
          .json(
            "Owner already exists"
          );
      }

      // HASH PASSWORD

      const hashedPassword =
        await bcrypt.hash(
          ownerPassword,
          10
        );

      // CREATE OWNER

      const owner =
        await User.create({
          name: ownerName,
          email: ownerEmail,
          password:
            hashedPassword,
          role: "owner",
        });

      // CREATE HOTEL

      const hotel =
        await Hotel.create({
          name: hotelName,
          address,
          phone,
          owner: owner._id,
        });

      // LINK HOTEL TO OWNER

      owner.hotelId = hotel._id;

      await owner.save();

      res.status(201).json({
        message:
          "Hotel created successfully",
        hotel,
        owner,
      });

    } catch (err) {

      console.log(
        "CREATE HOTEL ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });

    }
};
export const getAllHotels =
  async (req, res) => {

    try {

      const hotels =
        await Hotel.find()
          .populate(
            "owner",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      res.json(hotels);

    } catch (err) {

     console.log(err);

res.status(500).json({
  message: err.message,
  error: err,
});

    }
};
export const deleteHotel =
  async (req, res) => {

    try {

      await Hotel.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Hotel deleted",
      });

    } catch (err) {

      res.status(500).json(
        err.message
      );

    }
};