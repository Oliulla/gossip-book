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
const testCollection = client.db('gossip').collection('users');

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
app.get("/test", async (req, res) => {
  try {
    const test = await testCollection.find({}).toArray();
    if (test) {
      res.json({ status: true, message: "test got successfully", data: test });
    } else {
      res.json({ status: false, message: "data got failed", data: [] });
    }
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

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
