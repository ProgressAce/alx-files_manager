// Express application setup
const express = require('express');
const indexRouter = require('./routes/index');

const port = process.env.PORT || '5000';
const app = express();

app.use(express.json());
app.use(indexRouter);

app.listen(port, () => console.log('Server running on port', port));
