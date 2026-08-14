import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
// import transporter from "../config/mail.js";




export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    const cleanPassword = String(password || "");

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPassword
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    const existingUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        cleanPassword,
        10
      );

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: "owner",
      accountStatus: "active",
      subscriptionPlan: "trial",
      createdBy: "self",
      mustChangePassword: false,
      hotelId: null,
    });

    // =====================================================
    // AUTOMATIC LOGIN AFTER REGISTRATION
    // =====================================================

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        hotelId: null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log(
      "OWNER REGISTERED:",
      user.email
    );

    return res.status(201).json({
      message:
        "Owner registration successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus:
          user.accountStatus,
        subscriptionPlan:
          user.subscriptionPlan,
        createdBy:
          user.createdBy,
        hotel: null,
      },
    });

  } catch (err) {
    console.error(
      "OWNER REGISTRATION ERROR:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Registration failed",
    });
  }
};


export const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user =
      await User.findOne({
        email: cleanEmail,
      }).populate("hotelId");

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const match =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // =====================================================
    // ACCOUNT DEACTIVATED
    // =====================================================

    if (
      user.accountStatus ===
      "inactive"
    ) {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact the administrator.",
      });
    }

    // =====================================================
    // HOTEL DEACTIVATED
    // =====================================================

    if (
      user.role !== "superadmin" &&
      user.hotelId &&
      user.hotelId.isActive === false
    ) {
      return res.status(403).json({
        message:
          "Your hotel account is currently inactive. Please contact the administrator.",
      });
    }

    // =====================================================
    // JWT
    // =====================================================

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        hotelId:
          user.hotelId?._id ||
          null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      token,

      mustChangePassword:
        user.mustChangePassword ||
        false,

      hotelSetupCompleted:
        user.hotelId?.setupCompleted ||
        false,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus:
          user.accountStatus,
        subscriptionPlan:
          user.subscriptionPlan,
        hotel:
          user.hotelId || null,
      },
    });

  } catch (err) {
    console.error(
      "LOGIN ERROR:",
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        "Login failed",
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






// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         message: "Email is required",
//       });
//     }

//     const user = await User.findOne({
//       email: email.toLowerCase().trim(),
//     });

//     // Do not reveal whether an account exists
//     if (!user) {
//       return res.json({
//         message:
//           "If an account exists with this email, a password reset link has been sent.",
//       });
//     }

//     // Generate secure random token
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     // Store token in database
//     user.resetPasswordToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");

//     // Token valid for 15 minutes
//     user.resetPasswordExpires =
//       Date.now() + 15 * 60 * 1000;

//     await user.save();

//     const resetUrl =
//       `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

//     await transporter.sendMail({
//       from: `"FlexiOrder" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: "Reset Your FlexiOrder Password",

//       html: `
//         <div style="
//           font-family: Arial, sans-serif;
//           max-width: 600px;
//           margin: auto;
//           padding: 30px;
//           background: #f8fafc;
//           border-radius: 16px;
//         ">

//           <h2 style="color:#2563eb;">
//             FlexiOrder
//           </h2>

//           <h3>
//             Password Reset Request
//           </h3>

//           <p>
//             Hello ${user.name},
//           </p>

//           <p>
//             We received a request to reset your FlexiOrder
//             account password.
//           </p>

//           <p>
//             Click the button below to create a new password.
//           </p>

//           <a
//             href="${resetUrl}"
//             style="
//               display:inline-block;
//               padding:14px 24px;
//               background:#2563eb;
//               color:white;
//               text-decoration:none;
//               border-radius:10px;
//               font-weight:bold;
//             "
//           >
//             Reset Password
//           </a>

//           <p style="margin-top:25px;color:#64748b;">
//             This link will expire in 15 minutes.
//           </p>

//           <p style="color:#64748b;">
//             If you did not request this, you can safely ignore
//             this email.
//           </p>

//         </div>
//       `,
//     });

//     res.json({
//       message:
//         "If an account exists with this email, a password reset link has been sent.",
//     });

//   } catch (error) {
//   console.error("================================");
//   console.error("FORGOT PASSWORD ERROR:", error);
//   console.error("MESSAGE:", error.message);
//   console.error("CODE:", error.code);
//   console.error("================================");

//   return res.status(500).json({
//     message: error.message,
//   });
// }
// };
// export const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     if (!password) {
//       return res.status(400).json({
//         message: "New password is required",
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         message:
//           "Password must be at least 6 characters",
//       });
//     }

//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(token)
//       .digest("hex");

//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: {
//         $gt: Date.now(),
//       },
//     });

//     if (!user) {
//       return res.status(400).json({
//         message:
//           "Password reset link is invalid or expired",
//       });
//     }

//     user.password = await bcrypt.hash(
//       password,
//       10
//     );

//     // Remove reset token
//     user.resetPasswordToken = null;
//     user.resetPasswordExpires = null;

//     user.mustChangePassword = false;

//     await user.save();

//     res.json({
//       message:
//         "Password reset successfully",
//     });

//   } catch (error) {
//     console.error(
//       "RESET PASSWORD ERROR:",
//       error
//     );

//     res.status(500).json({
//       message:
//         "Unable to reset password",
//     });
//   }
// };