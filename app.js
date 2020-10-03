const express = require("express");

const app = express();

const oAuthData = require("./credentials.json");
const { google } = require("googleapis");

const clientID = oAuthData.web.client_id;
const client_secret = oAuthData.web.client_secret;
const redirect_url = oAuthData.web.redirect_uris[0];

const oAuthclient = new google.auth.OAuth2(
    clientID,
    client_secret,
    redirect_url
)

let authed = false

const Scopes =
    "https://www.googleapis.com/auth/drive.file  https://www.googleapis.com/auth/userinfo.profile"
 

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    if(!authed){
        let url = oAuthclient.generateAuthUrl({
            scope: Scopes,
            access_type:'offline'
        })
        res.render("index", {url:url});
    }else{
        console.log("successful")
    }
});

app.get('/google/callback',(req,res)=>{
    const code = req.query.code
    if(code){
        oAuthclient.getToken(code, function(err,token){
            if(err){
                console.log("Error ", err)
            }else{
                oAuthclient.setCredentials(token)
                authed = true
                res.redirect('/')
            }
        })
    }
})

app.listen(5000, () => {
  console.log("app runs on port 5000");
});
