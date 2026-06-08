const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.route");

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.get("/", (_, res) => {
    res.send("Server is running");
});

module.exports = app;