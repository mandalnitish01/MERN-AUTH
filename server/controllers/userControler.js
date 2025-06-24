import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import User from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import twilio from "twilio";
import { sendToken } from "../utils/sendToken.js";
import crypto from 'crypto'
// const client = new twilio(
//   process.env.TWILIO_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

const accountSid = process.env.TWILIO_SID;
// const accountSid = "34t43tfre5648768rtgdfbh";
const authToken = process.env.TWILIO_AUTH_TOKEN;
// const authToken = "ergetg4t343t43tgfr34r34q";
const twilioclient = new twilio(accountSid, authToken);

//register user
const register = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, phone, password, verificationMethod } = req.body;
    if (!name || !email || !phone || !password || !verificationMethod) {
      return next(new ErrorHandler("All fields are required", 400));
    }
    //add verification phone number
    function validatePhoneNumber(phone) {
      const phoneRegex = /^(\+91)?\d{10}$/; // Example regex for a 10-digit phone number
      return phoneRegex.test(phone);
    }
    //check validation of number
    if (!validatePhoneNumber(phone)) {
      return next(new ErrorHandler("Invalid phone number.", 400));
    }
    //check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email, accountVerified: true },
        { phone: phone, accountVerified: true },
      ],
    });
    if (existingUser) {
      return next(new ErrorHandler("Phone or email is already in use", 400));
    }

    //if user hit multiple request at the ssame time then we can prevent that situation by using this code file,

    const registerationAttemptsByUser = await User.find({
      $or: [
        { email: email, accountVerified: false },
        { phone: phone, accountVerified: false },
      ],
    });
    //if client hit more then 3 request then we can show the error.
    if (registerationAttemptsByUser.length > 3) {
      return next(
        new ErrorHandler(
          "You have exceeded maximum number of attempts (3). Please try again after an hour.",
          400
        )
      );
    }

    // Create a new user
    const userData = {
      name,
      email,
      phone,
      password,
    };

    const user = await User.create(userData);
    const verificationCode = await user.generateVerificationCode();
    console.log(`Your verification code is before save: ${verificationCode}`);
    await user.save(); //save created user in the DB

    // console.log(`Your verification code is after save : ${verificationCode}`);
    //console.log("TWILIO_SID", process.env.TWILIO_SID);
    //console.log("TWILIO_AUTH_TOKEN", process.env.TWILIO_AUTH_TOKEN);
    //console.log("TWILIO_PHONE_NUMBER", process.env.TWILIO_PHONE_NUMBER);

    sendVerificationCode(
      verificationMethod,
      verificationCode,
      name,
      email,
      phone,
      res
    );
  } catch (error) {
    next(error);
  }
});

//select send otp method to the user
async function sendVerificationCode(
  verificationMethod,
  verificationCode,
  name,
  email,
  phone,
  res
) {
  try {
    if (verificationMethod === "email") {
      // Send verification code via email
      const message = generateEmailTemplate(verificationCode);
      await sendEmail({ email, subject: "Your Verification code", message });
      res.status(200).json({
        success: true,
        message: `Verification email sent successfully to ${name}`,
      });

      // Implement your email sending logic here
      // console.log(Sending verification code ${verificationCode} to email: ${email});
    }
    //      else if (verificationMethod === "phone") {
    //       const verificationCodeWithSpace = verificationCode
    //         .toString()
    //         .split("")
    //         .join(" ");

    // //converted into E.164 format
    //       const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

    //       await client.calls.create({
    //         from: process.env.TWILIO_PHONE_NUMBER, // Twilio verified phone number
    //         to: formattedPhone, // Must be in E.164 format (e.g., +919570774782)
    //         twiml: `<Response><Say voice="alice">Your verification code is ${verificationCodeWithSpace}. Repeat, your verification code is ${verificationCodeWithSpace}.</Say></Response>`,
    //       });

    //       res.status(200).json({
    //         success: true,
    //         message: `OTP sent.`,
    //       });
    //     }
    else if (verificationMethod === "phone") {
      const verificationCodeWithSpace = verificationCode
        .toString()
        .split("")
        .join(" ");

      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      // Add validation for phone number
      if (!formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format.",
        });
      }

      // Verify Twilio client is properly initialized
      if (!twilioclient || typeof twilioclient.calls.create !== "function") {
        // console.error("Twilio client not properly initialized");
        throw new Error("Twilio client initialization failed");
      }

      const call = await twilioclient.calls.create({
        to: formattedPhone,
        // from: process.env.TWILIO_PHONE_NUMBER,
        from: process.env.TWILIO_PHONE_NUMBER, 
        twiml: `<Response><Say voice="alice">Your verification code is ${verificationCodeWithSpace}. Repeat, your verification code is ${verificationCodeWithSpace}.</Say></Response>`,
        // url: "http://demo.twilio.com/docs/voice.xml", // Fallback URL
      });

      // console.log(`Call SID: ${call.sid}`); // For debugging

      res.status(200).json({
        success: true,
        message: `OTP sent.`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Invalid verification method.",
      });
    }
  } catch (error) {
    // console.log(error);
    console.error("📞 Twilio Call Error:", error); // Log full error details

    return res.status(500).json({
      success: false,
      message: "Verification code failed to send.",
    });
  }
}

//create email template for send email
function generateEmailTemplate(verificationCode) {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>`;
}

//verifiy your account

const verifyOTP = catchAsyncError(async (req, res, next) => {
  // console.log("pagal hai kya, pagal hai kya tuu")
  // console.log(req.body);
  const { email, otp, phone } = req.body;
  // console.log("Email :",email);
  //add verification phone number
  // console.log("User Phone number before check the condition : ",phone)

  function validatePhoneNumber(phone) {
    const phoneRegex = /^(\+91)?\d{10}$/; // Example regex for a 10-digit phone number
    return phoneRegex.test(phone);
  }
  // console.log("User Phone number middle check the condition : ",phone)

  //check validation of number
  if (!validatePhoneNumber(phone)) {
    return next(new ErrorHandler("Invalid phone number.", 400));
  }
  // console.log("User Phone number after check the condition : ",phone)
  try {
    const userAllEntries = await User.find({
      $or: [
        { email, accountVerified: false },
        { phone, accountVerified: false },
      ],
    }).sort({ createdAt: -1 }); //sort in desending order

    console.log("User all entries :", userAllEntries);
    if (!userAllEntries) {
      return next(new ErrorHandler("User not found", 404));
    }

    let user;

    if (userAllEntries.length > 1) {
      user.userAllEntries[0];
      await User.deleteMany({
        _id: { $ne: user_id },
        $or: [
          { email, accountVerified: false },
          { phone, accountVerified: false },
        ],
      });
    } else {
      user = userAllEntries[0];
    }
    //check verification code and user types email
    if (user.verificationCode !== Number(otp)) {
      return next(new ErrorHandler("Invalid Otp", 400));
    }
    const currentTime = Date.now();

    const verificationCodeExpires = new Date(
      user.verificationCodeExpires
    ).getTime();
    console.log(currentTime);
    console.log(verificationCodeExpires);

    if (currentTime > verificationCodeExpires) {
      return next(new ErrorHandler("OTP expired", 404));
    }
    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, "Account Verified", res);
  } catch (error) {
    return next(new ErrorHandler("Internal server error", 500));
  }
});

//login controller
const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  console.log("user email :", email);
  console.log("user password:", password);
  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }
  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
  );
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 400));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email and password", 400));
  }
  sendToken(user, 200, "User Loggged in successfully", res);
});

//logout controller

const logout = catchAsyncError(async (req, res, next) => {
  // const {email} = req.body;
  // console.log("logoutes user email is :",email);
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
  console.log("user logout successfully.");
});

//get me

const getUser = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

const forgotPassword = catchAsyncError(async (req, res, next) => {
  // console.log("requested email :", req.body)
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true,
  });
  console.log("User details : ",user)

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const resetToken = user.generateResetPasswordToken();
  console.log("reset password token : ", resetToken);
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = `Your reset password token is:- \n \n  ${resetPasswordUrl}  \n \n if you have not requested this email then please ignore it.`;
  try {
    sendEmail({ email: user.email, subject: "RESET PASSWORD", message });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        error.message ? error.message : "Can not send reset passeord token",
        500
      )
    );
  }
});



const resetPassword = catchAsyncError(async(req,res,next)=>{
  const {token}= req.params;
  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now()},
  });
  if(!user){
    return next(new ErrorHandler("Reset password token is invalid or has been expires.",400));
  }

  if(req.body.password !== req.body.confirmPassword){
    return next(new ErrorHandler("Password and confiem password do not match.",400));
  }

  user.password = req.body.password;
  user.resetPasswordExpires = undefined;
  user.resetPasswordToken = undefined;
  await user.save();

  sendToken(user,200,"Reset password successfully.",res)
})

export { register, verifyOTP, login, logout, getUser, forgotPassword, resetPassword };
