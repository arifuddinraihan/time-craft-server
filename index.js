const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// App creation and port
const app = express();
const port = process.env.PORT || 5000;

// Middle Wares
app.use(cors());
app.use(express.json());

function verifyJwt(req, res, next) {
    // console.log('token inside verifyJwt', req.headers.authorization)
    const authHeader = req.headers.authorization
    if(!authHeader){
        res.status(401).send("Unauthorized access")
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token , process.env.ACCESS_TOKEN, function(error, decoded){
        if(error){
            res.status(403).send({message : 'forbidden access'})
        }
        req.decoded = decoded
        next()
    })
}

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
        app.get('/users', verifyJwt, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if(email !== decodedEmail){
                return res.status(403).send({message : 'forbidden access'})
            }
            const query = {};
            const userData = await usersCollection.find(query).toArray();
            res.send(userData)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
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