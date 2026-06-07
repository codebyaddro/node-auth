const mongoose = require("mongoose");

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connected");
    } catch (error) {
        console.log(`Database connection failed. Error: ${error}`);
        process.exit(1);
    }
};

module.exports = connectDB;