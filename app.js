const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// API 1 Register User
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
    const length = password.length;
    if (length > 5) {
      const dbResponse = await db.run(createUserQuery);
      response.status(200);
      response.send(`User created successfully`);
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`;

  const dbResponse = await db.get(userQuery);
  console.log(dbResponse);

  if (dbResponse === undefined) {
    // user doesn't exists
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbResponse.password
    );
    if (isPasswordMatched === true) {
      //Login success
      response.status(200);
      response.send("Login success!");
    } else {
      //Invalid password
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(userQuery);
  const isPasswordMatched = await bcrypt.compare(
    oldPassword,
    dbResponse.password
  );
  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  if (isPasswordMatched === true) {
    const changePasswordQuery = `UPDATE user SET password = '${newHashedPassword}';`;
    const length = newPassword.length;

    if (length > 5) {
      await db.run(changePasswordQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
