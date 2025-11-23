const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");

const gameRoutes = require("./routes/gameRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/games", gameRoutes);

connectDB().then(() => {
    app.listen(3000, () => console.log("🚀 Serveur sur http://localhost:3000"));
});
