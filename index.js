
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;



// middleware
app.use(cors(
    {
        origin: 'http://localhost:3000',
        Credential: true
    }
));
app.use(express.json());
app.use(bodyParser.json());




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
        const adminCollection = client.db("application").collection("adminAnza");


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
        /* app.post('/applicantCollection', async (req, res) => {
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

        }); */



        //POST API
        app.post('/applicantCollection', async (req, res) => {
            const newUser = req.body;
            console.log(newUser)
            const { email, cp_number } = newUser;
            console.log(email);
            // Validation: Check if email and cp_number are provided
            if (!email) {
                return res.status(400).send({ message: 'Email is required', insertedId: null });
            }

            if (!cp_number) {
                return res.status(400).send({ message: 'Phone number is required', insertedId: null });
            }

            try {

                const emailQuery = { email: email };

                const phoneQuery = { cp_number: cp_number };

                const emailExists = await applicantCollection.findOne(emailQuery);
                const phoneExists = await applicantCollection.findOne(phoneQuery);

                if (emailExists) {
                    return res.send({ message: 'Email already exists', insertedId: null });
                }

                if (phoneExists) {
                    return res.send({ message: 'Phone number already exists', insertedId: null });
                }

                // Get the highest app_id from the database to calculate the next app_id
                const lastApplicant = await applicantCollection.find().sort({ app_id: -1 }).limit(1).toArray(); // Sort by app_id descending
                const lastAppId = lastApplicant.length > 0 ? lastApplicant[0].app_id : 23999999; // Start with 24000000 for the first user

                // Increment app_id by 1 for the new user
                const nextAppId = lastAppId + 1;
                newUser.app_id = nextAppId;

                // Insert the new user into the database
                const result = await applicantCollection.insertOne(newUser);

                // Send success response with insertedId and app_id
                res.send({
                    message: 'Application submitted successfully!',
                    insertedId: result.insertedId,
                    app_id: newUser.app_id
                });
            } catch (error) {
                console.error('Error inserting user:', error.message);
                res.status(500).send({ message: 'Internal Server Error. Please try again later.' });
            }
        });






        // Post for Insert user info in database
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

                // Get the highest app_id from the database to calculate the next app_id
                const lastUser = await userCollection.find().sort({ app_id: -1 }).limit(1).toArray(); // Sort by app_id descending
                const lastAppId = lastUser.length > 0 ? lastUser[0].app_id : 23999999; // Start with 24000000 for the first user

                // Increment app_id by 1 for the new user
                const nextAppId = lastAppId + 1;
                newUser.app_id = nextAppId;

                // Insert the new user into the database
                const result = await userCollection.insertOne(newUser);

                // Send success response with insertedId and app_id
                res.send({
                    message: 'User added successfully!',
                    insertedId: result.insertedId,
                    app_id: newUser.app_id
                });
            } catch (error) {
                console.error('Error inserting user:', error.message);
                res.status(500).send({ message: 'Internal Server Error. Please try again later.' });
            }
        });




        //  get individual user
        app.get('/user/:userEmail', async (req, res) => {
            const email = req.params.userEmail;
            console.log('Received userEmail:', email);

            try {
                // Query the database
                const query = { email: email }; // Case-sensitive query
                const user = await applicantCollection.findOne(query);

                if (user) {
                    res.status(200).send(user); // Send the user document as a response
                } else {
                    res.status(404).send({ message: 'User not found' }); // No match
                }
            } catch (error) {
                console.error('Error fetching user:', error.message);
                res.status(500).send({ message: 'Internal server error' }); // Catch errors
            }
        });





        // Post for login   user in database
        app.post('/loginUser', async (req, res) => {
            const { email, password, cp_number } = req.body;

            try {
                // Query to find a user with matching email, password, and number
                const query = { email, password, cp_number };
                const userExists = await applicantCollection.findOne(query);

                if (userExists) {
                    // If user exists, send success response
                    return res.send({
                        success: true,
                        message: 'Login successful!',
                    });
                } else {
                    // If credentials do not match
                    return res.send({
                        success: false,
                        message: 'Invalid login credentials information(email or number or password). Please check and try again.',
                    });
                }
            } catch (error) {
                console.error('Error during login:', error.message);
                res.status(500).send({ message: 'Internal Server Error. Please try again later.' });
            }
        });




        // for admin login 
        app.post('/adminLogin', async (req, res) => {
            const { adminEmail, password } = req.body;
            // console.log("from admin login", adminEmail, password);

            // Check if adminEmail or password is undefined
            if (!adminEmail || !password) {
                return res.status(400).send({
                    success: false,
                    message: 'Email or password cannot be empty. Please provide valid credentials.',
                });
            }

            try {
                // Query to find admin with matching email, password, and number
                const query = { adminEmail, password };
                const userExists = await adminCollection.findOne(query);

                if (userExists) {
                    // If admin exists, send success response
                    return res.send({
                        success: true,
                        message: 'Admin Login successful!',
                    });
                } else {
                    // If credentials do not match
                    return res.send({
                        success: false,
                        message: 'Invalid login credentials information(email or password). Please check and try again.',
                    });
                }
            } catch (error) {
                console.error('Error during login:', error.message);
                res.status(500).send({ message: 'Internal Server Error. Please try again later.' });
            }
        });





        // bekash payent
        app.post('/bkash/payment/create', async (req, res) => {


        })





        // by use get All applicants find
        app.get('/applicants', async (req, res) => {
            const result = await applicantCollection.find().toArray();
            res.send(result);
        })

        // by using get method to get computer operator APplicant data between all applicants find with postName filter
        app.get('/computerOperator', async (req, res) => {
            try {
                const result = await applicantCollection.find({ postName: "Computer Operator" }).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "An error occurred while fetching applicants." });
            }
        });


        // by using get method to get unpaid applicant data between all applicants find with postName filter
        app.get('/unpaid', async (req, res) => {
            try {
                const result = await applicantCollection.find({ status: "Unpaid" }).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "An error occurred while fetching applicants." });
            }
        });


        /* date wise applicant table create get method to get date count for applicant */
        app.get('/dateWiseApplicants', async (req, res) => {
            try {
                const result = await applicantCollection.aggregate([
                    {
                        // Match applicants that have a valid 'date' field
                        $match: {
                            date: { $ne: null, $exists: true } // Exclude applicants without a 'date' field or with null date
                        }
                    },
                    {
                        // Ensure 'date' is a valid Date object
                        $addFields: {
                            date: { $toDate: "$date" }
                        }
                    },
                    {
                        // Group by date and count the applicants
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, // Group by formatted date
                            dateCount: { $sum: 1 }, // Count the applicants
                            applicants: { $push: "$$ROOT" } // Push the entire applicant data into an array
                        }
                    },
                    {
                        // Sort by date
                        $sort: { _id: 1 }
                    },
                    {
                        // Project the final result
                        $project: {
                            _id: 1, // Exclude _id field from the output
                            date: "$_id", // Rename _id to 'date'
                            dateCount: 1, // Include dateCount field
                            applicants: 1 // Include applicants for the given date
                        }
                    }
                ]).toArray();

                res.send(result);
            } catch (err) {
                console.error("Aggregation error: ", err);
                res.status(500).send({ error: "Failed to fetch data", details: err.message });
            }
        });



        // Search applicant id and phone number from application collection
        app.get('/search', async (req, res) => {
            const query = req.query.q; // Get query parameter (app_id or cp_number)

            console.log("Query:", query, "Type:", typeof query);

            if (!query) {
                return res.status(400).json({ error: 'Query parameter (q) is required' });
            }

            try {
                // Attempt to convert the query to a number (if it's numeric)
                const numericQuery = !isNaN(query) ? Number(query) : null;

                // Query the database
                const result = await applicantCollection.findOne({
                    $or: [
                        { app_id: numericQuery },       // Match `app_id` as a number
                        { app_id: query },             // Match `app_id` as a string
                        { cp_number: query }           // Match `cp_number` (always string)
                    ]
                });

                if (result) {
                    res.status(200).json(result);
                } else {
                    res.status(404).json({ message: 'No applicant found' });
                }
            } catch (error) {
                console.error('Search Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // Get method to find a single applicant by ID
        app.get('/singleApplicant/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) };

            try {
                // Find the applicant using the query
                const result = await applicantCollection.findOne(query);

                if (!result) {
                    // If no applicant is found, return a 404 error
                    return res.status(404).send({ message: 'Applicant not found' });
                }

                // Send the found applicant data
                res.send(result);
            } catch (error) {
                // Handle any errors that occur during the database operation
                console.error('Error fetching applicant:', error);
                res.status(500).send({ message: 'Server error' });
            }
        });




        // update applicant info by using patch
        app.patch('/updateApplicant/:id', async (req, res) => {
            const { id } = req.params;
            const updatedFields = req.body;
            console.log(updatedFields);

            try {
                const result = await applicantCollection.updateOne(
                    { _id: new ObjectId(id) }, // Match the document by ID
                    { $set: updatedFields } // Update only the provided fields
                );

                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: 'Update successful' });
                } else {
                    res.status(404).json({ message: 'Applicant not found or no changes made' });
                }
            } catch (error) {
                console.error('Error updating applicant:', error);
                res.status(500).json({ message: 'An error occurred' });
            }
        });




        // update applicant image and signature by using patch
        app.patch('/updateApplicantImage/:id', async (req, res) => {
            const { id } = req.params;
            const updatedFields = req.body; // The fields to update from the request body

            console.log(updatedFields);

            try {
                // Find the applicant document
                const applicant = await applicantCollection.findOne({ _id: new ObjectId(id) });
                if (!applicant) {
                    return res.status(404).json({ message: 'Applicant not found' });
                }

                // Construct the update object
                let updateObj = {};

                // Only update fields that are present in the request body
                if (updatedFields.images && updatedFields.images.image1) {
                    updateObj['images.image1'] = updatedFields.images.image1;
                }
                if (updatedFields.images && updatedFields.images.image2) {
                    updateObj['images.image2'] = updatedFields.images.image2;
                }
                if (updatedFields.date) {
                    updateObj['date'] = updatedFields.date;
                }

                // Update the applicant data in the database
                const result = await applicantCollection.updateOne(
                    { _id: new ObjectId(id) }, // Match the document by ID
                    { $set: updateObj } // Update only the specified fields
                );

                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: 'Update successful' });
                } else {
                    res.status(404).json({ message: 'No changes made' });
                }
            } catch (error) {
                console.error('Error updating applicant:', error);
                res.status(500).json({ message: 'An error occurred' });
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