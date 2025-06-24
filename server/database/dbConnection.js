// dbConnection.js
import mongoose from 'mongoose';

const connection = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "MERN_AUTHENTICATION",
  }).then(()=>{
    console.log("Database connected successfully");
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1); // Exit the process with failure
  });

};

export default connection;
