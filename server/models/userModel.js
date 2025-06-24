import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
// import dotenv from 'dotenv'
// dotenv.config();
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: {
    type: String,
    minlength: [8, "Password must be at least 8 characters"],
    maxlength: [20, "Password cannot exceed 20 characters"],
    select: false,
  },
  phone: String,
  accountVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: Number,
  verificationCodeExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateVerificationCode = async function () {
  function generateRandomSixDigitNumber() {
    const firstDigit = Math.floor(Math.random() * 9) + 1; // Generates a 6-digit code
    const remainingDigits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, 0); // Generates a 6-digit code
    return parseInt(firstDigit + remainingDigits);
  }
  const verificationCode = generateRandomSixDigitNumber();
  this.verificationCode = verificationCode;
  this.verificationCodeExpires = Date.now() + 5 * 60 * 1000; // Code expires in 5 minutes
  return verificationCode;
};
//send unique token
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRATE_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

userSchema.methods.generateResetPasswordToken = function () {
  const resetToken =  crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");


    this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model("User", userSchema);
export default User;
