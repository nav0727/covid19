const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertStateDbObjToResObj = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

const convertDistDbObjToResObj = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

//get ALL states API

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state; `;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertStateDbObjToResObj(eachState))
  );
});

// get single state  api

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSingleQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const states = await database.get(getSingleQuery);
  response.send(convertStateDbObjToResObj(states));
});

//Post district  api

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) 
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;

  const distr = await database.run(postQuery);
  response.send("District Successfully Added");
});

//get single district

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getSingleDistQuery = `SELECT * FROM district WHERE district_id=${districtId} ;`;
  const dist = await database.get(getSingleDistQuery);
  response.send(convertDistDbObjToResObj(dist));
});

//delete dist API

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const delSingleDistQuery = `DELETE  FROM district WHERE district_id=${districtId} ;`;
  const distr = await database.run(delSingleDistQuery);
  response.send("District Removed");
});

//PUT   district  API

app.put("/districts/:districtId", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistQuery = `UPDATE district SET  district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} WHERE district_id=${districtId} ;`;
  await database.run(updateDistQuery);
  response.send("District Details Updated");
});

//stateWise status API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getTotalQuery = `SELECT SUM(cases) AS totalCases,
                                    SUM(cured) AS totalCured,
                                    SUM(active) AS totalActive ,
                                    SUM(deaths) AS totalDeaths
                     FROM  state NATURAL JOIN  district  WHERE state_id=${stateId};`;

  const totalSum = await database.get(getTotalQuery);
  response.send(totalSum);
});
//get stateName API

app.get("/districts/:districtId/details/", async (request, response) => {
  // const { totalCases,totalCured, totalActive,totalDeaths  }=request.body
  const { stateName } = request.body;
  const { districtId } = request.params;

  const getNameQuery = `SELECT state_name 
                     FROM state  NATURAL JOIN  district WHERE district_id=${districtId};`;

  const stateNam = await database.get(getNameQuery);
  response.send(convertStateDbObjToResObj(stateNam));
});

module.exports = app;
