// api using express

const express = require('express');
const indexRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(indexRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
