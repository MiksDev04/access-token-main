import fs from "fs";
import jwt from "jsonwebtoken"

const sa = JSON.parse(fs.readFileSync("./private-key.json"));

const now = Math.floor(Date.now() / 1000);

const payload = {
  iss: sa.client_email,
  scope: "https://www.googleapis.com/auth/datastore",
  aud: "https://oauth2.googleapis.com/token",
  iat: now,
  exp: now + 3600
};

const signedJWT = jwt.sign(payload, sa.private_key, { algorithm: "RS256" });

console.log(signedJWT);

const params = new URLSearchParams();
params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
params.append("assertion", signedJWT);

const res = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: params
});

const data = await res.json();
console.log("Access Token:", data.access_token);
