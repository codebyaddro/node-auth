const express = require("express");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.route");

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (_, res) => {
    res.send("Server is running");
});

module.exports = app;