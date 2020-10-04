const express = require("express");

const app = express();
const multer = require("multer");
const oAuthData = require("./credentials.json");
const { google } = require("googleapis");

const clientID = oAuthData.web.client_id;
const client_secret = oAuthData.web.client_secret;
const redirect_url = oAuthData.web.redirect_uris[0];

const oAuthclient = new google.auth.OAuth2(
  clientID,
  client_secret,
  redirect_url
);

let authed = false;

const Scopes =
  "https://www.googleapis.com/auth/drive.file  https://www.googleapis.com/auth/userinfo.profile";

app.set("view engine", "ejs");

var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./files");
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: Storage,
}).single("file");

app.get("/", (req, res) => {
  if (!authed) {
    let url = oAuthclient.generateAuthUrl({
      scope: Scopes,
      access_type: "offline",
    });
    res.render("index", { url: url });
  } else {
    let oauth2 = google.oauth2({
      version: "v2",
      auth: oAuthclient,
    });

    oauth2.userinfo.get(function (err, response) {
      if (err) throw err;
      name = response.data.given_name;
      pic = response.data.picture;

      res.render("success", { name: name, pic: pic });
    });
  }
});

app.get("/google/callback", (req, res) => {
  const code = req.query.code;
  if (code) {
    oAuthclient.getToken(code, function (err, token) {
      if (err) {
        console.log("Error ", err);
      } else {
        oAuthclient.setCredentials(token);
        authed = true;
        res.redirect("/");
      }
    });
  }
});

app.post("/upload", (req, res) => {});

app.listen(5000, () => {
  console.log("app runs on port 5000");
});
