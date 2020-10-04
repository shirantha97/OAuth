const express = require("express");
const fileStream = require('fs')
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

app.locals.success = false

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

app.post("/upload", (req, res) => {

    upload(req,res, function(err){
        if(err) throw err
        console.log(req.file.path)

        const drive = google.drive({ version: 'v3', auth: oAuthclient })
        const filemetaData = {name:req.file.filename} 
        const mimetype = {
            mimetype: req.file.mimetype,
            body: fileStream.createReadStream(req.file.path)
        }
        
        drive.files.create({
            resource: filemetaData,
            media: mimetype,
            fields: "id",
    
        }, (err, file) => {
            if(err) throw err
            fileStream.unlinkSync(req.file.path)
            res.render("success")
            app.locals.success = true
        }) 
    })


});

app.listen(5000, () => {
  console.log("app runs on port 5000");
});
