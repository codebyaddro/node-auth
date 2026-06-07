const http = require("http");

const connectDB = require("./src/configs/db.config");
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

connectDB();

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));