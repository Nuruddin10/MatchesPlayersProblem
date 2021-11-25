const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server And DB initialized successfully");
    });
  } catch (e) {
    console.log(`DbError: ${e.message}`);
    process.exit();
  }
};

initializeServerAndDb();

const GettingPlayerDetails = (eachPlayer) => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  };
};

const GettingMatchDetails = (eachMatch) => {
  return {
    matchId: eachMatch.match_id,
    match: eachMatch.match,
    year: eachMatch.year,
  };
};

app.get("/players/", async (request, response) => {
  const QueryForGettingPlayers = `
    SELECT * FROM player_details ;`;
  const dbResponse = await db.all(QueryForGettingPlayers);
  response.send(
    dbResponse.map((eachPlayer) => GettingPlayerDetails(eachPlayer))
  );
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const RequestBody = request.body;
  const { playerName } = RequestBody;
  const QueryForUpdatingThePlayerDetails = `
    UPDATE player_details SET player_name = '${playerName}' 
    WHERE player_id = ${playerId};`;
  await db.run(QueryForUpdatingThePlayerDetails);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const QueryForGettingRequestedMatchDetails = `
    SELECT * FROM match_details WHERE match_id = ${matchId} ;`;
  const dbResponse = await db.get(QueryForGettingRequestedMatchDetails);
  response.send(GettingMatchDetails(dbResponse));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const QueryForGettingRequestedPlayer = `SELECT * FROM 
    player_details WHERE player_id = ${playerId} ;`;
  const dbResponse = await db.get(QueryForGettingRequestedPlayer);
  response.send(GettingPlayerDetails(dbResponse));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const QueryForGettingRequestedPlayerMatches = `
    SELECT * FROM player_match_score NATURAL JOIN match_details 
    WHERE player_id = ${playerId} ;`;
  const dbResponse = await db.all(QueryForGettingRequestedPlayerMatches);
  response.send(dbResponse.map((eachMatch) => GettingMatchDetails(eachMatch)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const QueryForStatistics = `SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score 
    NATURAL JOIN player_details 
    WHERE player_id = ${playerId} ;`;
  const PlayerStats = await db.get(QueryForStatistics);
  response.send(PlayerStats);
});

module.exports = app;
