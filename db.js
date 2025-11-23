const { MongoClient } = require("mongodb");

const MONGODB_URI = "mongodb://localhost:27017";
const DB_NAME = "game_collection_db";

let db;

async function connectDB() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("✅ MongoDB connecté");
    db = client.db(DB_NAME);
}

function getDB() {
    return db;
}

module.exports = { connectDB, getDB };
