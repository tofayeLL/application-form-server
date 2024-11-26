
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;



// middleware
app.use(cors());
app.use(express.json());




// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://application:xavi132DSAbHFu4Y@cluster0.5er8w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5er8w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // collection
        const applicantCollection = client.db("application").collection("applicants");
        const userCollection = client.db("application").collection("users");


        //GET API
        app.get('/applicantCollection', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            console.log(query);
            const cursor = applicantCollection.find(query);
            // const cursor = applicantCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });



        //POST API
        app.post('/applicantCollection', async (req, res) => {
            const newUser = req.body;
            // const query = { email: newUser.email }


            const emailQuery = { email: newUser.email };
            const phoneQuery = { phoneNumber: newUser.cp_number };

            const emailExists = await applicantCollection.findOne(emailQuery);
            const phoneExists = await applicantCollection.findOne(phoneQuery);

            if (emailExists) {
                return res.send({ message: 'Email already exists', insertedId: null });
            }

            if (phoneExists) {
                return res.send({ message: 'Phone number already exists', insertedId: null });
            }
            const result = await applicantCollection.insertOne(newUser);
            // console.log('got new user', req.body);
            // console.log('added user', result);
            res.json(result);

        });



        // post for Insert user info in database
        app.post('/userInfo', async (req, res) => {
            const newUser = req.body;
            const { userEmail, number } = newUser; // Destructure userEmail and number
        
            try {
                // Check if email or phone number already exists in the database
                const emailQuery = { userEmail: userEmail };
                const phoneQuery = { number: number };
        
                const emailExists = await userCollection.findOne(emailQuery);
                const phoneExists = await userCollection.findOne(phoneQuery);
        
                if (emailExists) {
                    return res.send({ message: 'Email already exists! Please use another email.', insertedId: null });
                }
        
                if (phoneExists) {
                    return res.send({ message: 'Phone number already exists! Please use a new phone number.', insertedId: null });
                }
        
                // If both email and phone number are unique, insert the new user
                const result = await userCollection.insertOne(newUser);
        
                // Send success response with insertedId
                res.send({ message: 'User added successfully!', insertedId: result.insertedId });
            } catch (error) {
                console.error('Error inserting user:', error.message);
                res.status(500).send({ message: 'Internal Server Error. Please try again later.' });
            }
        });
        



        //update user
        app.get('/applicantCollection/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await applicantCollection.findOne(query);
            res.json(result);
        })

        //DELETE API
        app.delete('/applicantCollection/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await applicantCollection.deleteOne(query);
            console.log('Deleting id', id);
            res.json(result);
        })




        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('application Server is running... ');
})

app.listen(port, () => {
    console.log(`application Server is running at port:${port}`)
})