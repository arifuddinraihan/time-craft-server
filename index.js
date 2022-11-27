const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    if (!authHeader) {
        res.status(401).send("Unauthorized access")
    }
    const token = authHeader.split(' ')[1];
    // console.log(token)
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            res.status(403).send({ message: 'forbidden access' })
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
        const newsLetterCollection = client.db('timeCraftDB').collection('newsLetter');
        const allProductsCollection = client.db('timeCraftDB').collection('allProducts');
        const productsCategoryCollection = client.db('timeCraftDB').collection('productsCategory');
        const bookedProductCollection = client.db('timeCraftDB').collection('bookedProduct');
        // const allProductCollection = 

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access, your are not an Admin' })
            }
            next();
        }
        const verifyBuyer = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'Buyer') {
                return res.status(403).send({ message: 'forbidden access, your are not anBuyer' })
            }
            next();
        }
        const verifySeller = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'Seller') {
                return res.status(403).send({ message: 'forbidden access, your are not a Seller' })
            }
            next();
        }

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: "7d" })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        })

        app.post('/newsLetterEmails', async (req, res) => {
            const email = req.body;
            // console.log(email)
            const newsLetterEmail = await newsLetterCollection.insertOne(email)
            res.send(newsLetterEmail)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: user?.name,
                    imageURL: user?.imageURL,
                },
            };
            const userData = await usersCollection.updateOne(user, updateDoc, options)
            // console.log(userData)
            res.send(userData)
        })

        // Problem in user data base using google login
        app.patch('/users', async (req, res) => {
            const user = req.body;
            const email = user?.email;
            const query = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: user?.name,
                    imageURL: user?.imageURL,
                },
            };
            const userData = await usersCollection.updateOne(query, updateDoc, options)
            res.send(userData)
        })

        app.get('/users', verifyJwt, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = {};
            const userData = await usersCollection.find(query).toArray();
            res.send(userData)
        })

        app.get('/users/sellers', verifyJwt, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { role: "Seller" };
            const userData = await usersCollection.find(query).toArray();
            res.send(userData)
        })

        app.delete('/users/sellers/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })
        app.delete('/users/buyers/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })

        app.put('/users/sellers/:id', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user.role !== "admin") {
                return res.status(403).send({ message: 'forbidden access, your not an Admin' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    verifySeller: "yes"
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        app.get('/users/sellers', verifyJwt, verifyBuyer, async (req, res) => {
            const query = { verifySeller : "yes" };
            console.log(result)
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/users/buyers', verifyJwt, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { role: "Buyer" };
            const userData = await usersCollection.find(query).toArray();
            res.send(userData)
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const adminUser = await usersCollection.findOne(query)
            res.send({ isAdmin: adminUser?.role === 'admin' });
        })
        app.get('/users/sellers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const adminUser = await usersCollection.findOne(query)
            res.send({ isSeller: adminUser?.role === 'Seller' });
        })
        app.get('/users/buyers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const adminUser = await usersCollection.findOne(query)
            res.send({ isBuyer: adminUser?.role === 'Buyer' });
        })

        // Admin making an Admin from usersCollection only buyer can e be an Admin
        app.put('/users/admin/:id', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user.role !== "admin") {
                return res.status(403).send({ message: 'forbidden access, your not an Admin' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        app.get('/productsCategory', async (req, res) => {
            const query = {}
            const result = await productsCategoryCollection.find(query).toArray()
            res.send(result);
        })
        app.get('/productsCategory/:name', async (req, res) => {
            const category = req.params.name
            const filter = { categoryName: category }
            const result = await productsCategoryCollection.findOne(filter)
            // console.log(result)
            res.send(result);
        })
        app.get('/productsPerCategory', async (req, res) => {
            const category = req.query.name
            // console.log(category)
            const filter = { category: category }
            const result = await allProductsCollection.find(filter).toArray()
            // console.log(result)
            res.send(result);
        })

        app.post('/allProducts', async (req, res) => {
            const productDetails = req.body;
            const newPostedProduct = await allProductsCollection.insertOne(productDetails)
            res.send(newPostedProduct);
        })

        app.put('/allProducts/:id', verifyJwt, verifyBuyer, async(req, res)=>{
            const id = req.params.id
            const query = { _id : ObjectId(id) }
            const options = {upsert : true}
            const updateDoc = {
                $set: {
                    reportedProduct : "yes"
                }
            }
            const reported = await allProductsCollection.updateOne(query, updateDoc, options)
            console.log(reported)
            res.send(reported)
        })
        app.delete('/allProducts/:id', verifyJwt, verifySeller, async (req, res) => {
            const id = req.params.id
            // console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await allProductsCollection.deleteOne(query)
            // console.log(result)
            res.send(result);
        })

        app.get('/allProducts', verifyJwt, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const category = await productsCategoryCollection.find()
            const query = {};
            const getAllProducts = await allProductsCollection.find(query).toArray()
            res.send(getAllProducts);
        })

        app.get('/allProducts/seller', verifyJwt, async (req, res) => {
            const email = req.query.email
            // console.log(email)
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { sellerEmail: decodedEmail };
            const userData = await allProductsCollection.find(query).toArray();
            // console.log(userData)
            res.send(userData)
        })

        app.post('/bookedProducts', verifyJwt, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const bookedProduct = req.body
            // console.log(bookedProduct)
            const result = await bookedProductCollection.insertOne(bookedProduct);
            res.send(result);
        })
        app.get('/bookedProducts', verifyJwt, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { clientEmail: email }
            // console.log(bookedProduct)
            const result = await bookedProductCollection.find(query).toArray();
            res.send(result);
        })
        app.delete('/bookedProducts/:id', verifyJwt, verifyBuyer, async (req, res) => {
            const id = req.params.id
            // console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await bookedProductCollection.deleteOne(query)
            // console.log(result)
            res.send(result);
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