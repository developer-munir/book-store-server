const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

// verufy JWT token

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorization access !!" });
  }
  const token = authHeader.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(402).send({
        success: false,
        message: "Forbidden access",
      });
    }
    req.decoded = decoded;
    next();
  });
}

//.............verify Admin........................

const verifyAdmin = async (req, res, next) => {
  const decodedEmail = req.decoded.email;

  const query = {
    email: decodedEmail,
  };

  const user = await usersCollection.findOne(query);
  if (user?.role !== "Admin") {
    return res.status(403).send({
      message: "You are not  admin,so  cannot visit this route!!",
    });
  }
  next();
};

//.............verify Seller........................

const verifySeller = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = {
    email: decodedEmail,
  };

  const user = await usersCollection.findOne(query);
  if (user?.role !== "Seller") {
    return res.status(403).send({
      message: "You are not  seller , so  cannot visit this route !!",
    });
  }
  next();
};
// //.............verify Buyer........................

const verifyBuyer = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = {
    email: decodedEmail,
  };

  const user = await usersCollection.findOne(query);
  if (user?.role !== "Buyer") {
    return res.status(403).send({
      message: "You are not  Buyer , so  cannot visit this route !!",
    });
  }
  next();
};

const book = async () => {
  try {
    const productsData = client.db("bookStore").collection("books");
    const productCetegorisData = client.db("bookStore").collection("cetegoris");
    const usersCollection = client.db("bookStore").collection("users");
    const reviewCollection = client.db("bookStore").collection("reviews");
    const cartCollection = client.db("bookStore").collection("carts");
    const whisListCollection = client.db("bookStore").collection("whislist");
    const paymentsCollection = client.db("bookStore").collection("payments");

    //--.............create jwt.......................--

    app.get("/jwt/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "7d",
        });
        return res.send({ token: token });
      }
      res.status(401).send({ token: "" });
    });

    // <.......get Role........>

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const result = await usersCollection.find({}).toArray();
      res.send(result);
    });

    // save user in DB

    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

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

    //=====payment Start======

     app.post("/create-payment-intent", async (req, res) => {
       const booking = req.body;
       const price = booking.price;
       const amount = price * 100;

       const paymentIntent = await stripe.paymentIntents.create({
         currency: "usd",
         amount: amount,
         payment_method_types: ["card"],
       });
       res.send({
         clientSecret: paymentIntent.client_secret,
       });
     });

     app.post("/payments", async (req, res) => {
       const payment = req.body;
       const result = await paymentsCollection.insertOne(payment);
       const id = payment.bookingId;
       const filter = { _id: ObjectId(id) };
       const updatedDoc = {
         $set: {
           paid: true,
           transactionId: payment.transactionId,
         },
       };
       const updatedResult = await productsData.updateOne(filter, updatedDoc);
       res.send(result);
     });
    //=====payment end======


    app.get("/products", async (req, res) => {
      const page = parseInt(req.query?.page);
      const size = parseInt(req.query?.size);
      const keyword = req.query.keyword;
      const books = await productsData
        .find({})
        .skip(page * size)
        .limit(size)
        .toArray();
      const data = books;
      const count = await productsData.estimatedDocumentCount();

      if (keyword) {
        let data = books.filter((item) =>
          item.title.toLowerCase().includes(keyword.toLocaleLowerCase())
        );
        return res.send({ data, count });
      }
      res.send({ data, count });
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

    // <................get product accoriding to seller email .................>

    app.get("/product/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { sellerEmail: email };
      const result = await productsData.find(filter).toArray();
      res.send(result);
    });

    // <................post product .................>

    app.post("/addProduct", async (req, res) => {
      const product = req.body;
      const result = await productsData.insertOne(product);
      res.send(result);
    });

    // .................. delete product ................

    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productsData.deleteOne(filter);
      res.send(result);
    });

    // <............. get all seller .................>

    app.get("/seller", async (req, res) => {
      const filter = {
        role: "Seller",
      };
      const result = await usersCollection.find(filter).toArray();
      res.send(result);
    });

    // .................. delete seller ................

    app.delete("/seller/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    // <............. get all buyer .................>

    app.get("/buyer", async (req, res) => {
      const filter = {
        role: "buyer",
      };
      const result = await usersCollection.find(filter).toArray();
      res.send(result);
    });
    // .................. delete buyer ................
    app.delete("/buyer/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    // .................. get cart product ................

    app.get("/cart/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await cartCollection.find(filter).toArray();
      res.send(result);
    });

    // .................. post cart product ................

    app.post("/cart", async (req, res) => {
      const product = req.body;
      const result = await cartCollection.insertOne(product);
      res.send(result);
    });

    // .................. delete cart product ................

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await cartCollection.deleteOne(filter);
      res.send(result);
    });

    // .................. get whislist product ................

    app.get("/whislist/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await whisListCollection.find(filter).toArray();
      res.send(result);
    });

    // .................. post whislist product ................

    app.post("/whislist", async (req, res) => {
      const product = req.body;
      const result = await whisListCollection.insertOne(product);
      res.send(result);
    });

    // .................. delete whislist product ................

    app.delete("/whislist/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await whisListCollection.deleteOne(filter);
      res.send(result);
    });

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
