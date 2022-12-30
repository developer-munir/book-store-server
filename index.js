const express = require("express");
const app = express();
const cors = require("cors");
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  ObjectId,
} = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("book store server running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.r7d25w3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const book = async () => {
  try {
    const productsData = client.db("bookStore").collection("books");
    const productCetegorisData = client.db("bookStore").collection("cetegoris");
    const usersCollection = client.db("bookStore").collection("users");

    // app.get('/update', async (req, res) => {
    //     const filter = {};
    //     const options = { upsert: true };
    //     const updateDoc = {
    //         $set: {
    //             pay:false,
    //             hotSell:false,
    //             bestSell:false,
    //             trendSell:false,
    //         },
    //     };

    //     const result = await productsData.updateMany(filter, updateDoc, options);
    //     res.send(result);
    // })
    // any colleaciton for update funtion

    app.get("/products", async (req, res) => {
      const books = await productsData.find({}).toArray();
      res.send(books);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const books = await productsData.findOne(query);
      res.send(books);
    });
    // get all products from db

    app.get("/cetegoris", async (req, res) => {
      const cetegoris = await productCetegorisData.find({}).toArray();
      res.send(cetegoris);
    });
    // get all cetegoris from db

    app.get("/offer/:offer", async (req, res) => {
      let offer = req.params.offer;
      const query = { discount: offer };
      const discountItems = await productsData.find(query).limit(6).toArray();
      res.send(discountItems);
    });
    // get offer books from db

    app.get("/trendsell", async (req, res) => {
      const query = { trendSell: true };
      const data = await productsData.find(query).toArray();
      res.send(data);
    });
    // get trend sell products from db

    app.get("/hotsell", async (req, res) => {
      const query = { hotSell: true };
      const data = await productsData.find(query).toArray();
      res.send(data);
    });
    // get hot sell products from db

    app.get("/bestsell", async (req, res) => {
      const query = { bestSell: true };
      const data = await productsData.find(query).toArray();
      res.send(data);
    });
    // get best sell products from db

    app.get("/cetegory/:id", async (req, res) => {
      const id = req.params.id;
      let query = { id: id };
      const data = await productsData.find(query).toArray();
      res.send(data);
    });
    // category products load from db

    // save user in DB
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // save user in DB
    
    // get review load Bd Start
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { id: id };
      const rev = await reviewCollection.find(query).toArray();
      res.send(rev);
    });
    //get review load Bd End
  } finally {
  }
};
book().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("server running", port);
});
