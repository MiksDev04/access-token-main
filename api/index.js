import jwt from "jsonwebtoken";

// Token cache (will reset on cold starts)
let cachedToken = null;
let tokenExpiry = 0;

// Function to get or refresh access token
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && tokenExpiry > now + 300) {
    return cachedToken;
  }

  // Get service account from environment
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set");
  }
  
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/userinfo.email",
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;
  const path = url.split('?')[0];
  const pathParts = path.split('/').filter(Boolean);

  try {
    // Health check
    if (path === '/health' || path === '/') {
      return res.status(200).json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        endpoints: [
          "GET /health",
          "GET /api/token",
          "GET /api/firestore/:collection",
          "GET /api/firestore/:collection/:documentId",
          "POST /api/firestore/:collection/:documentId",
          "DELETE /api/firestore/:collection/:documentId"
        ]
      });
    }

    // Get access token
    if (path === '/api/token' && method === 'GET') {
      const token = await getAccessToken();
      return res.status(200).json({ 
        access_token: token,
        expires_in: tokenExpiry - Math.floor(Date.now() / 1000)
      });
    }

    // Firestore operations
    if (pathParts[0] === 'api' && pathParts[1] === 'firestore') {
      const token = await getAccessToken();
      const projectId = process.env.FIREBASE_PROJECT_ID || "nosql-demo-e5885";
      const collection = pathParts[2];
      const documentId = pathParts[3];

      // List documents in collection
      if (method === 'GET' && collection && !documentId) {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await response.json();
        return res.status(response.status).json(data);
      }

      // Get specific document
      if (method === 'GET' && collection && documentId) {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await response.json();
        return res.status(response.status).json(data);
      }

      // Create/Update document
      if (method === 'POST' && collection && documentId) {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;
        
        // Convert request body to Firestore format
        const firestoreDoc = { fields: {} };
        
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
        return res.status(response.status).json(data);
      }

      // Delete document
      if (method === 'DELETE' && collection && documentId) {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;
        
        const response = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          return res.status(200).json({ success: true, message: "Document deleted" });
        } else {
          const data = await response.json();
          return res.status(response.status).json(data);
        }
      }
    }

    // Route not found
    return res.status(404).json({ error: "Route not found" });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
