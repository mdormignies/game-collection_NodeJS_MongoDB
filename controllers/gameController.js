const Game = require("../models/gameModel");

/**
 * Helper: normalize request body into the shape souhaitée
 */
function buildGameFromBody(body) {
  // champs attendus et valeurs par défaut
  const now = new Date();
  const game = {
    titre: String(body.titre || "").trim(),
    genre: [],
    plateforme: [],
    editeur: body.editeur ? String(body.editeur) : "",
    developpeur: body.developpeur ? String(body.developpeur) : "",
    annee_sortie: null,
    metacritic_score: null,
    temps_jeu_heures: null,
    termine: false,
    favoris: !!body.favoris,
    date_ajout: now,
    date_modification: now
  };

  // parser genre (array ou string "A,B")
  if (Array.isArray(body.genre)) {
    game.genre = body.genre.map(g => String(g).trim()).filter(g => g.length);
  } else if (typeof body.genre === "string") {
    game.genre = body.genre.split(",").map(s => s.trim()).filter(s => s.length);
  }

  // parser plateforme
  if (Array.isArray(body.plateforme)) {
    game.plateforme = body.plateforme.map(p => String(p).trim()).filter(p => p.length);
  } else if (typeof body.plateforme === "string") {
    game.plateforme = body.plateforme.split(",").map(s => s.trim()).filter(s => s.length);
  }

  // caster nombres si fournis
  if (body.annee_sortie !== undefined && body.annee_sortie !== null && body.annee_sortie !== "") {
    const n = Number(body.annee_sortie);
    game.annee_sortie = Number.isFinite(n) ? n : null;
  }

  if (body.metacritic_score !== undefined && body.metacritic_score !== null && body.metacritic_score !== "") {
    const m = Number(body.metacritic_score);
    game.metacritic_score = Number.isFinite(m) ? m : null;
  }

  if (body.temps_jeu_heures !== undefined && body.temps_jeu_heures !== null && body.temps_jeu_heures !== "") {
    const t = Number(body.temps_jeu_heures);
    game.temps_jeu_heures = Number.isFinite(t) ? t : null;
  }

  // caster boolean termine (accepte "true"/"false" ou bool)
  if (body.termine !== undefined) {
    if (typeof body.termine === "boolean") game.termine = body.termine;
    else if (typeof body.termine === "string") {
      const s = body.termine.toLowerCase();
      game.termine = (s === "true" || s === "1");
    } else {
      game.termine = Boolean(body.termine);
    }
  }

  return game;
}

exports.createGame = async (req, res) => {
  try {
    const payload = req.body;
    const { ok, message } = Game.validateGamePayload(payload);
    if (!ok) return res.status(400).json({ error: message });

    const game = buildGameFromBody(payload);
    // si tu veux forcer genre/plateforme obligatoires : vérifie ici
    // Exemple: if (game.genre.length === 0) return res.status(400).json({error: "genre requis"});
    const created = await Game.createGame(game);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne" });
  }
};

exports.getGames = async (req, res) => {
  try {
    const filter = {};
    // prendre en charge les filtres multiples : ?genre=RPG&plateforme=PC
    if (req.query.genre) {
      // supporte genre=RPG ou genre=RPG,Action
      const genreVals = String(req.query.genre).split(",").map(s => s.trim()).filter(Boolean);
      filter.genre = { $in: genreVals };
    }
    if (req.query.plateforme) {
      const platVals = String(req.query.plateforme).split(",").map(s => s.trim()).filter(Boolean);
      filter.plateforme = { $in: platVals };
    }
    const games = await Game.getAllGames(filter);
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne" });
  }
};

exports.getGameById = async (req, res) => {
  try {
    const game = await Game.getGameById(req.params.id);
    if (!game) return res.status(404).json({ error: "Jeu introuvable" });
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne" });
  }
};

exports.updateGame = async (req, res) => {
  try {
    // on merge seulement les champs autorisés pour éviter d'effacer date_ajout
    const body = req.body;
    const toUpdate = {};
    const allowed = ["titre","genre","plateforme","editeur","developpeur","annee_sortie","metacritic_score","temps_jeu_heures","termine","favoris"];
    allowed.forEach(k => {
      if (body[k] !== undefined) toUpdate[k] = body[k];
    });
    // caster/normaliser via buildGameFromBody: utiliser uniquement pour type conversion
    const normalized = buildGameFromBody(Object.assign({}, toUpdate, { titre: toUpdate.titre || "" }));
    // ne pas toucher date_ajout
    delete normalized.date_ajout;
    const updated = await Game.updateGame(req.params.id, normalized);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne" });
  }
};

exports.deleteGame = async (req, res) => {
  try {
    await Game.deleteGame(req.params.id);
    res.json({ message: "Jeu supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne" });
  }
};

/* ---- Bonus ---- */

exports.stats = async (req, res) => {
  try {
    const games = await Game.getAllGames();

    const total_jeux = games.length;
    const temps_total_heures = games.reduce((sum, g) => sum + (g.temps_jeu_heures || 0), 0);
    const jeux_termines = games.filter(g => g.termine).length;

    const metacritic_values = games
      .map(g => g.metacritic_score)
      .filter(n => typeof n === "number");

    const metacritic_moyen = metacritic_values.length > 0
      ? (metacritic_values.reduce((s, n) => s + n, 0) / metacritic_values.length).toFixed(1)
      : 0;

    res.json({
      total_jeux,
      temps_total_heures,
      jeux_termines,
      metacritic_moyen
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
};

exports.favorite = async (req, res) => {
  try {
    const updated = await Game.updateGame(req.params.id, { favoris: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne" });
  }
};

exports.exportData = async (req, res) => {
  try {
    const games = await Game.getAllGames();
    res.setHeader("Content-Disposition", "attachment; filename=games.json");
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne" });
  }
};
