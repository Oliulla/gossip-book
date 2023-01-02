const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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

// verify jwt authorization
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_TOKEN, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

// db collections
// const testCollection = client.db('gossip').collection('users');
// const allUsersLikedCollection = client.db("gossip").collection("usersLiked");
const allUsersPostCollection = client.db("gossip").collection("userPosts");
const usersCollection = client.db("gossip").collection("users");
const allUsersCommentsCollection = client
  .db("gossip")
  .collection("usersComments");

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

// users liked push to db
app.put("/usersposts/liked", async (req, res) => {
  try {
    const likedPost = req.body;
    const id = likedPost.postId;
    const likedUser = likedPost.likedUserEmail;
    // console.log(id, likedUser);
    const filter = { _id: ObjectId(id) };

    const options = { upsert: true };
    const updatedDoc = {
      $push: {
        likedUsers: likedUser,
      },
    };

    const result = await allUsersPostCollection.updateOne(
      filter,
      updatedDoc,
      options
    );

    if (result.acknowledged) {
      res.send(result);
    }
  } catch (error) {
    res.json({
      status: false,
      message: error.message,
    });
  }
});

// users disliked and pop from db
app.put("/usersposts/disliked", async (req, res) => {
  try {
    const likedPost = req.body;
    const id = likedPost.postId;
    const likedUser = likedPost.likedUserEmail;
    // console.log(id, likedUser);
    const filter = { _id: ObjectId(id) };

    const options = { upsert: true };
    const updatedDoc = {
      $pull: {
        likedUsers: likedUser,
      },
    };

    const result = await allUsersPostCollection.updateOne(
      filter,
      updatedDoc,
      options
    );

    if (result.acknowledged) {
      res.send(result);
    }
  } catch (error) {
    res.json({
      status: false,
      message: error.message,
    });
  }
});

// send three data depends on most likes
app.get("/usersposts/trendings", async (req, res) => {
  try {
    const allPosts = await allUsersPostCollection.find({}).toArray();
    // console.log(allPosts)
    // console.log(allPosts.likedUsers)
    // const topLiked = allPosts.filter(post => console.log())
    const sortedPosts = allPosts.sort((firstObj, secondObj) => {
      // console.log(firstObj, secondObj)
      const firstObjLen = parseInt(firstObj?.likedUsers?.length);
      const secondObjLen = parseInt(secondObj?.likedUsers?.length);
      // return a.likedUsers?.length - b.likedUsers?.length;
      return secondObjLen - firstObjLen;
    });

    // console.log("check sorting", sortedPosts)
    // console.log(allPosts)
    const trendingsPosts = sortedPosts?.splice(0, 3);
    // console.log("three trendings posts", trendingsPosts);

    if (allPosts) {
      res.send(trendingsPosts);
    }
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

// send specific post data
app.get("/usersposts/:id", async (req, res) => {
  try {
    const postId = req.params?.id;
    // console.log(postId);
    const query = { _id: ObjectId(postId) };
    // console.log(query);
    const userPosts = await allUsersPostCollection.findOne(query);
    // console.log(userPosts);
    if (userPosts) {
      res.json({
        status: true,
        message: "usersposts got successfully",
        data: userPosts,
      });
    } else {
      res.json({ status: false, message: "data got failed", data: [] });
    }
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

// send specific user post
app.get("/userpost/:email", verifyJWT, async (req, res) => {
  try {
    const email = req.params?.email;
    // console.log(email)
    const query = {
      postUserEmail: email,
    };
    const allPosts = await allUsersPostCollection.find(query).toArray();
    // console.log(allPosts);
    res.send(allPosts);
  } catch (error) {
    res.send(error?.message);
    console.log(error);
  }
});

// save commentinfo to db
app.put("/usersposts/comments", async (req, res) => {
  try {
    const doc = req.body;
    const id = doc?.commentPostId;
    const commentUserEmail = doc?.userEmail;
    // console.log(id, likedUser);
    const filter = { _id: ObjectId(id) };

    const options = { upsert: true };
    const updatedDoc = {
      $push: {
        commentUsers: commentUserEmail,
      },
    };

    const result1 = await allUsersPostCollection.updateOne(
      filter,
      updatedDoc,
      options
    );
    const result2 = await allUsersCommentsCollection.insertOne(doc);

    if (result1 && result2) {
      res.send({ result1, result2 });
    }
  } catch (error) {
    console.log(error?.message);
  }
});

app.get("/userposts/allcomments", async (req, res) => {
  try {
    const query = {};
    const allComments = await allUsersCommentsCollection.find(query).toArray();
    res.send(allComments);
  } catch (error) {
    res.send(error.message);
    console.log(error?.message);
  }
});

// save user to db
// post users
app.put("/users", async (req, res) => {
  try {
    const user = req.body;
    const filter = { email: user?.email };
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        userName: user?.displayName,
        userPhotoURL: user?.photoURL,
      },
    };
    const result = await usersCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
  } catch (error) {
    res.json({
      status: false,
      message: error.message,
    });
  }
});

// find a user
app.get("/users", async (req, res) => {
  try {
    const email = req.query?.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    res.send(user);
  } catch (error) {
    res.send(error.message);
    console.log(error);
  }
});

// insert update info for a user
app.put("/users/update", async (req, res) => {
  try {
    const updateProfile = req.body?.updateInfo;
    // const filter = {_id: }
    const id = updateProfile.userId;
    const filter = { _id: ObjectId(id) };
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        updatedName: updateProfile?.updatedName,
        updatedEmail: updateProfile?.updatedEmail,
        updatedEducation: updateProfile?.updatedEducation,
        updatedAddress: updateProfile?.updatedAddress,
      },
    };

    // console.log(filter, updateProfile);
    const result = await usersCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
  // console.log(updateProfile);
});

// get all users
app.get("/allusers", async (req, res) => {
  try {
    const users = await usersCollection.find({}).toArray();
    // console.log(users);
    res.send(users);
  } catch (error) {
    console.log(error?.message);
    res.send(error?.message);
  }
});

// jwt authorization
app.get("/jwt", async (req, res) => {
  try {
    const email = req.query.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    if (user) {
      const token = jwt.sign({ email }, process.env.JWT_TOKEN);
      return res.send({ accessToken: token });
    }
    res.status(403).send({ accessToken: "" });
  } catch (error) {
    res.send(error.message);
    console.log(error);
  }
});

// temporary to update postscollection
// app.get('/addname', async (req, res) => {
//     // console.log(email)
//     // const email = 'leo@gmail.com';
//     const name = 'Cristiano Ronaldo'
//     const filter = {}
//     const options = { upsert: true }
//     const updatedDoc = {
//         $set: {
//             userName: name
//         }
//     }
//     const result = await usersCollection.updateMany(filter, updatedDoc, options);
//     console.log(result)
//     res.send(result);
// })

// temporary insert user to users collection
// app.get("/adduser", async (req, res) => {
//   const result = await usersCollection.insertMany([
//     { email: "leo@gmail.com" },
//     { email: "ron@gmail.com" },
//     { email: "razasm29@gmail.com" },
//   ]);
//   console.log(result);
//   res.send(result);
// });

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
