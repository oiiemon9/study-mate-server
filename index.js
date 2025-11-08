const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello StudyMate');
});

//try

app.listen(port, () => {
  console.log(`example app listening on port ${port}`);
});
