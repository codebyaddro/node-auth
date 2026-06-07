const mongoose = require("mongoose");
const config = require("./config");

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log("Database connected");
    } catch (error) {
        console.log(`Database connection failed. Error: ${error}`);
        process.exit(1);
    }
};

module.exports = connectDB;