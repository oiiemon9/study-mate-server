const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gj5u2pw.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get('/', (req, res) => {
  res.send('Hello StudyMate');
});

app.listen(port, () => {
  console.log(`example app listening on port ${port}`);
});

async function run() {
  try {
    await client.connect();

    const studyMate = client.db('studyMate');
    const partnerProfilesCollection = studyMate.collection('partnerProfiles');
    const myPartnerCollection = studyMate.collection('myPartner');

    const findMyPartner = async (req, res, next) => {
      const partnerInfo = req.body;
      const query = {
        userEmail: partnerInfo.userEmail,
        partnerId: partnerInfo.partnerId,
      };
      const findMyPartner = await myPartnerCollection.findOne(query);
      if (!findMyPartner) {
        next();
      } else {
        res.send({ message: 'Partner Already Connected' });
      }
    };

    app.post('/partnerProfiles', async (req, res) => {
      const profile = req.body;
      profile.create_at = new Date();
      const result = await partnerProfilesCollection.insertOne(profile);
      res.send(result);
    });

    app.get('/top-study-partners', async (req, res) => {
      const result = await partnerProfilesCollection
        .find()
        .sort({ rating: -1 })
        .limit(4)
        .toArray();
      res.send(result);
    });

    app.get('/all-partners', async (req, res) => {
      const result = await partnerProfilesCollection.find().toArray();
      res.send(result);
    });

    app.get('/partner/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await partnerProfilesCollection.findOne(query);
      res.send(result);
    });

    app.get('/find-partners', async (req, res) => {
      const search = req.query.search;
      const sortBy = req.query.sortBy || '';

      const experienceOrder = ['Beginner', 'Intermediate', 'Expert'].filter(
        (x) => x !== sortBy
      );

      let searchValue = '';
      if (search) {
        searchValue = search;
      }

      const result = await partnerProfilesCollection
        .aggregate([
          {
            $match: {
              subject: { $regex: searchValue, $options: 'i' },
            },
          },
          {
            $addFields: {
              sortOrder: {
                $indexOfArray: [experienceOrder, '$experienceLevel'],
              },
            },
          },
          {
            $sort: { sortOrder: 1 },
          },
        ])
        .toArray();

      res.send(result);
    });

    app.get('/my-partner', async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await myPartnerCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/my-partner', findMyPartner, async (req, res) => {
      const info = req.body;
      const result = await myPartnerCollection.insertOne(info);
      res.send(result);
      if (result.insertedId) {
        await partnerProfilesCollection.updateOne(
          {
            _id: new ObjectId(info.partnerId),
          },
          {
            $inc: { partnerCount: 1 },
          }
        );
      }
    });

    app.patch('/my-partner/:id', async (req, res) => {
      const id = req.params.id;
      const updateInfo = req.body;
      const query = { _id: new ObjectId(id) };
      const update = { $set: updateInfo };
      const options = {};
      const result = await myPartnerCollection.updateOne(
        query,
        update,
        options
      );
      res.send(result);
    });

    app.delete('/my-partner/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myPartnerCollection.deleteOne(query);
      res.send(result);
    });

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
