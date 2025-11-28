import express from "express";
import fs from "fs";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Token cache
let cachedToken = null;
let tokenExpiry = 0;

// Function to get or refresh access token
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && tokenExpiry > now + 300) {
    return cachedToken;
  }

  // Generate new token
  const sa = JSON.parse(fs.readFileSync("./private-key.json"));
  
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/userinfo.email",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const signedJWT = jwt.sign(payload, sa.private_key, { algorithm: "RS256" });

  const params = new URLSearchParams();
  params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  params.append("assertion", signedJWT);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const data = await res.json();
  
  if (data.access_token) {
    cachedToken = data.access_token;
    tokenExpiry = now + 3600;
    return cachedToken;
  }
  
  throw new Error("Failed to get access token");
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get access token endpoint
app.get("/api/token", async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ 
      access_token: token,
      expires_in: tokenExpiry - Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Firestore - Get document
app.get("/api/firestore/:collection/:documentId", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { collection, documentId } = req.params;
    const projectId = "nosql-demo-e5885";
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Firestore - Create/Update document
app.post("/api/firestore/:collection/:documentId", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { collection, documentId } = req.params;
    const projectId = "nosql-demo-e5885";
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;
    
    // Convert request body to Firestore format
    const firestoreDoc = {
      fields: {}
    };
    
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        firestoreDoc.fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        firestoreDoc.fields[key] = { integerValue: value };
      } else if (typeof value === 'boolean') {
        firestoreDoc.fields[key] = { booleanValue: value };
      }
    }
    
    const response = await fetch(url, {
      method: "PATCH",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(firestoreDoc)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Firestore - List documents in collection
app.get("/api/firestore/:collection", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { collection } = req.params;
    const projectId = "nosql-demo-e5885";
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Firestore - Delete document
app.delete("/api/firestore/:collection/:documentId", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { collection, documentId } = req.params;
    const projectId = "nosql-demo-e5885";
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      res.json({ success: true, message: "Document deleted" });
    } else {
      const data = await response.json();
      res.status(response.status).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Firebase API Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/token`);
  console.log(`   GET  /api/firestore/:collection`);
  console.log(`   GET  /api/firestore/:collection/:documentId`);
  console.log(`   POST /api/firestore/:collection/:documentId`);
  console.log(`   DELETE /api/firestore/:collection/:documentId`);
});
