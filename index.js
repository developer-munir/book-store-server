const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express());

app.get('/', (req, res) => {
    res.send('book store server running')
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xsnvn7k.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const book = async () => {
    try {
        const productsData = client.db('bookStore').collection('books');
        const productCetegorisData = client.db('bookStore').collection('cetegoris');

        app.get('/products', async (req, res) => {
            const books = await productsData.find({}).toArray();
            res.send(books);
        });
        // get all products from db 

        app.get('/cetegoris', async (req, res)=>{
            const cetegoris = await productCetegorisData.find({}).toArray();
            res.send(cetegoris);
        })

    }
    finally {

    }
}
book().catch(error => console.log(error));


app.listen(port, () => {
    console.log('server running', port)
});