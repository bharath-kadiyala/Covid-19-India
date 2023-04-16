const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let dataBase = null;

const initializeDbAnsServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running on http://lcoalhost:3000");
    });
  } catch (error) {
    console.log(`DataBase Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAnsServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//1.list of all states API

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT * FROM state`;
  const getAllSt = await dataBase.all(getAllStatesQuery);
  response.send(
    getAllSt.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//2. Get specific state API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSpeStateQuery = `
    SELECT 
        *
    FROM
        state
    WHERE
         state_id = ${stateId}`;
  const getAnAState = await dataBase.get(getSpeStateQuery);
  response.send(convertDbObjectToResponseObject(getAnAState));
});

//3.Create a district API

app.post("/districts/", async (request, response) => {
  const districtObj = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtObj;
  const addDistQuery = `
  INSERT INTO
    district(district_name,state_id,cases,cured, active, deaths)
  VALUES(
    '${districtName}',
    '${stateId}',
    '${cases}',
    '${cured}',
    '${active}',
    '${deaths}'
  )`;
  await dataBase.run(addDistQuery);
  response.send("District Successfully Added");
});

//4.Returns a district based on the district ID API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getSpcDistQuery = `
    SELECT
        *
    FROM 
        district
    WHERE
        district_id = ${districtId}`;
  const getAnADist = await dataBase.get(getSpcDistQuery);
  response.send(convertDbObjectToResponseObject(getAnADist));
});

//5.Deletes a district API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteSpecDistQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId}`;
  await dataBase.run(deleteSpecDistQuery);
  response.send("District Removed");
});

//6.Updates the details of a specific API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDistObj = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = updateDistObj;
  const updateDistQuery = `
    UPDATE 
        district
    SET 
        district_name = '${districtName}',
        state_id = '${stateId}',
        cases = '${cases}',
        cured = '${cured}',
        active = '${active}',
        deaths = '${deaths}'`;
  await dataBase.run(updateDistQuery);
  response.send("District Details Updated");
});

//7.Returns the statistics API

const staticsConversion = (conversion) => {
  return {
    totalCases: conversion.cases,
    totalCured: conversion.cured,
    totalActive: conversion.active,
    totalDeaths: conversion.deaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT 
    cases,cured, active, deaths
  FROM 
    district
  WHERE
    district_id = ${stateId}`;
  const onlyStatics = await dataBase.get(getStateQuery);
  response.send(staticsConversion(onlyStatics));
});

//8.GET state name of a district API

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateQuery = `
    SELECT 
        state_name
    FROM
        state
        NATURAL JOIN district
    WHERE
        district_id = ${districtId}`;
  const getStateFromDist = await dataBase.get(stateQuery);
  response.send(convertDbObjectToResponseObject(getStateFromDist));
});

module.exports = app;
