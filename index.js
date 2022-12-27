const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || "5000";

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.g9drewa.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// db collections
// const testCollection = client.db('gossip').collection('users');
const allUsersPostCollection = client.db("gossip").collection("userPosts");

// run mongodb
async function dbConnect() {
  try {
    await client.connect();
    console.log("database connected");

    // database collections
  } finally {
  }
}
dbConnect().catch((err) => console.log(err));

// endpoints
// users post save to db
app.post("/usersposts", async (req, res) => {
  try {
    const doc = req.body;
    // console.log(doc);
    const result = await allUsersPostCollection.insertOne(doc);
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

// send all users post
try {
  app.get("/usersposts", async (req, res) => {
    const options = {
      sort: { uploadTime: -1 },
    };
    const allPosts = await allUsersPostCollection.find({}, options).toArray();
    res.send(allPosts);
  });
} catch (error) {
  res.json({
    status: false,
    message: error.message,
    data: null,
  });
}

// test server endpoint
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "gossip server is ready to use",
  });
});

app.listen(port, () => {
  console.log(`gossip server is running on: ${port}`);
});
