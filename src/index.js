const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api', scheduleRoutes);

app.get('/', (req, res) => {
  res.send('EdTech platform service is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
