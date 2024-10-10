const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');  // For MongoDB (replace with pg for PostgreSQL)
const schema = require('./src/models/weather.schema');  // GraphQL schema
const weatherModel = require('./src/models/weather.model')
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// MongoDB connection (replace with PostgreSQL config if needed)
mongoose.connect('mongodb://localhost:27017/weatherdb', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true,
}));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
