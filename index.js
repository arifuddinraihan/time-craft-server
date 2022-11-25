const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// App creation and port
const app = express();
const port = process.env.PORT || 5000;

// Middle Wares
app.use(cors());
app.use(express.json());

// MongoDB Credential
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tsvgbta.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db('timeCraftDB').collection('users');

        app.post('/users', async (req, res) => {
            const user = req.body;
            const userData = await usersCollection.insertOne(user)
            res.send(userData)
        })
        app.get('/users', async (req, res) => {
            const query = {};
            const userData = await usersCollection.find(query).toArray();
            res.send(userData)
        })



    }
    finally {

    }
}
run().catch(console.log)



app.get('/', (req, res) => {
    res.send("Time Craft server is running!")
})

app.listen(port, () => {
    console.log(`Time Craft server running on ${port} `)
})