const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WeatherSchema = new Schema({
    city: { type: String, required: true },
    description: { type: String },
    temperature: { type: Number, required: true },
    date: { type:String },
});

module.exports = mongoose.model('Weather', WeatherSchema);
