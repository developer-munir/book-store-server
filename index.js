const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

    app.get('/trendsell', async (req, res) => {
      const query = { trendSell: true };
      const data = await productsData.find(query).toArray();
      res.send(data);
    });
    // get trend sell products from db 

    app.get('/hotsell', async (req, res) => {
      const query = { hotSell: true };
      const data = await productsData.find(query).toArray();
      res.send(data);
    });
    // get hot sell products from db 

    app.get('/bestsell', async (req, res) => {
      const query = { bestSell: true };
      const data = await productsData.find(query).toArray();
      res.send(data);
    });
    // get best sell products from db 

    app.get('/cetegory/:id', async (req, res) => {
      const id = req.params.id;
      let query = { id: id };
      const data = await productsData.find(query).toArray();
      res.send(data);
    });
    // category products load from db 

  }
  finally {
  }
};
book().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("server running", port);
});
