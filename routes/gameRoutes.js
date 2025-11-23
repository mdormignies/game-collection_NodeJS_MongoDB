const express = require("express");
const controller = require("../controllers/gameController");
const router = express.Router();

router.post("/", controller.createGame);
router.get("/", controller.getGames);
router.get("/stats", controller.stats);
router.get("/export", controller.exportData);
router.get("/:id", controller.getGameById);
router.put("/:id", controller.updateGame);
router.delete("/:id", controller.deleteGame);
router.post("/:id/favorite", controller.favorite);

module.exports = router;
