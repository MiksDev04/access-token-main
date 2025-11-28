# After downloaded this repository

**Installation**
- extract the zip file
- open the root folder
- right click open to vscode, or type cmd in the folder url at the top
- **you make sure your directory have package.json**
- open a terminal inside vscode
- run `npm install` or `npm i`
- to start `node sign-jwt.js`
- copy your private key

---

## To get the private key:
- open your project
- navigate the project settings
- Service account
- **Download your private key**
- then run the sign-jwt.js by `node sign-jwt.js`

---

# Firestore Database
**Export or Download your access account config**

If your firebase use firestore you need to get your access account from your settings of firestore

Sample url: [https://firestore.googleapis.com/v1/projects/<PROJECT_ID>/databases/(default)/documents/users](https://firestore.googleapis.com/v1/projects/<PROJECT_ID>/databases/(default)/documents/users)

**The bearer is the access token from the sign-jwt.js**
- Authorization: Bearer <ACCESS_TOKEN>

---

# Realtime Database
**Just put a ".json" in the end of url example:**

https://nosql-demo-bd597-default-rtdb.firebaseio.com/.json

**or if you need specific collection**

https://nosql-demo-bd597-default-rtdb.firebaseio.com/users.json
