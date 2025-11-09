const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    app.post('/partnerProfiles', async (req, res) => {
      const profile = req.body;
      console.log(profile);
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

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
