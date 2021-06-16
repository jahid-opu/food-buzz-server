const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

require('dotenv').config()
const port = process.env.PORT || 5000

app.use(cors());
app.use(bodyParser());

// firebase admin
var serviceAccount = require("./configs/food-buzz-dae1a-firebase-adminsdk-ykghy-5f4d2f31d8.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n1fwb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const foodCollection = client.db("foodBuzz").collection("food");
  const orderCollection = client.db("foodBuzz").collection("orders");

// Post Food to database
  app.post('/addFood',(req, res) => {
    const newFood = req.body;
    foodCollection.insertOne(newFood)
    .then(result => {
      console.log("inserted Count:",result.insertedCount);
    })
  })
  // Post order
  app.post('/addOrder',(req, res)=>{
    const newOrder = req.body;
    console.log(newOrder);
    orderCollection.insertOne(newOrder)
    .then(result => {
      console.log("inserted Count:",result.insertedCount);
    })
  })

  // Read foods
  app.get('/foods',(req, res) => {
    foodCollection.find({})
    .toArray((err,items) => {
      res.send(items)
    })
  })

  // Read food by id
  app.get('/food/:id',(req, res)=>{
    foodCollection.find({_id: ObjectId(req.params.id)})
    .toArray((err,documents) => {
      res.send(documents[0]);
    })
  })


  app.get('/orders', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });

      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            orderCollection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents);
              })
          }
          else{
            res.status(401).send('Unauthorized access')

          }
          // ...
        })
        .catch((error) => {
          // Handle error
          res.status(401).send('Unauthorized access')

        });
    }
    else {
      res.status(401).send('Unauthorized access')
    }
  })

  app.delete('/delete/:id',(req, res)=>{
    foodCollection.deleteOne({_id: ObjectId(req.params.id)})
    .then(result => {
      res.send(result.deletedCount>0);
    })
    })
  // client.close();
});


app.listen(port)