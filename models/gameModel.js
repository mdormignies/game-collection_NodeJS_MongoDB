const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

const COLLECTION = "games";

/**
 * Validation simple : titre requis. Les autres champs sont optionnels mais typés.
 */
function validateGamePayload(data) {
  if (!data || typeof data !== "object") return { ok: false, message: "Payload manquant" };
  if (!data.titre || typeof data.titre !== "string" || data.titre.trim().length === 0) {
    return { ok: false, message: "Le champ 'titre' est requis" };
  }
  // genres and plateformes can be arrays or comma-separated strings (handled in controller)
  return { ok: true };
}

async function createGame(game) {
  const db = getDB();
  const result = await db.collection(COLLECTION).insertOne(game);
  // Retourner le document créé pour faciliter le debug (avec _id)
  const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
  return created;
}

async function getAllGames(filter = {}) {
  const db = getDB();
  return await db.collection(COLLECTION).find(filter).toArray();
}

async function getGameById(id) {
  const db = getDB();
  return await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

async function updateGame(id, data) {
  const db = getDB();
  data.date_modification = new Date();
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  );
  return getGameById(id);
}

async function deleteGame(id) {
  const db = getDB();
  return await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
}

module.exports = {
  validateGamePayload,
  createGame,
  getAllGames,
  getGameById,
  updateGame,
  deleteGame
};
