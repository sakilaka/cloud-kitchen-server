const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');


const app = express();
const port = process.env.PORT || 5000;


//middleware

app.use(cors())
app.use(express.json())

// mongoDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@kamrul.iyiyxhu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {

        return res.status(401).send({ errrr: 'unauthorized' })
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {

        if (err) {
            return res.status(401).sned({ errr: 'unauthorized' });
        }
        req.decoded = decoded;
        next();
    })
}



async function run() {

    try {
        const serviceCollection = client.db('cloudKitchen').collection('services');
        const reviewCollection = client.db('cloudKitchen').collection('reviews');


        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })

        app.get('/services-limit', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services);
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        })

        //reviews here

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })


        app.put('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const updateReview = req.body;
            // console.log(updateReview);
            const option = { upsert: true };
            const updatedReview = {
                $set: {
                    foodID: updateReview.foodID,
                    foodName: updateReview.foodName,
                    email: updateReview.email,
                    name: updateReview.name,
                    photoURL: updateReview.photoURL,
                    rating: updateReview.rating,
                    message: updateReview.message
                }
            }
            const result = await reviewCollection.updateOne(filter, updatedReview, option);
            res.send(result);
        })

        app.get('/reviews', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log('decode', decoded);

            if (decoded.email !== req.query.email) {
                return res.status(403).send({ errror: 'unauthorized' })
            }

            const queryEmail = req.query.email;
            console.log(queryEmail);
            let query = {};
            if (req.query.email) {
                query = {
                    email: queryEmail
                }
            }
            const cursore = reviewCollection.find(query).sort({ _id: -1 });
            const reviews = await cursore.toArray();
            res.send(reviews);
        })

        app.get('/reviews', async (req, res) => {
            let queryID = {};
            if (req.query.foodID) {
                queryID = {
                    foodID: req.query.foodID
                }
            }
            const cursor = reviewCollection.find(queryID);
            const result = await cursor.toArray();
            res.send(result)
        })

       

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewCollection.findOne(query);
            res.send(review);
        })

        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query)
            res.send(result);
        })

    }
    catch {

    }

}
run().catch(error => console.log(error))




app.get('/', (req, res) => {
    res.send('Cloud computing server is running.')
})






app.listen(port, () => {
    console.log('running', port);
})