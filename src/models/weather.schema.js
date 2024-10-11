const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLSchema, GRAPHQL_MAX_INT, GraphQLFloat } = require('graphql');
const Weather = require('./weather.model');
const axios = require('axios');
const logger = require('../logger')


// Weather Type
const WeatherType = new GraphQLObjectType({
    name: 'Weather',
    fields: () => ({
        id: { type: GraphQLString },
        city: { type: GraphQLString },
        description: { type: GraphQLString },
        temperature: { type: GraphQLFloat },
        date: { type: GraphQLString },
    })
});

// Root Query
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        weather: {
            type: new GraphQLList(WeatherType),
            args: { city: { type: GraphQLString }, from: { type: GraphQLString }, to: { type: GraphQLString } },
            async resolve(parent, args) {

                const apiKey = '350fac9a58f4dd3f0fedaea50a75c190';
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${args.city}&appid=${apiKey}&units=metric`;
                try {
                    logger.info(`START : Weather Details On Dates : city = ${args.city} : from = ${args.from} to = ${args.to}`)
                    const response = await axios.get(url);
                    if (response.data && response.data.length > 0) {
                        const { lat, lon } = response.data[0];
                        /*
                        convert date to unix timestamp
                        */
                        const startDate = new Date(args.from);
                        const startUnixTimestamp = Math.floor(startDate.getTime() / 1000);

                        const endDate = new Date(args.to);
                        const endUnixTimestamp = Math.floor(endDate.getTime() / 1000);
                        logger.info(`Calling History Weather API : city = ${args.city} : from = ${args.from} to = ${args.to}`)
                        const url = `https://history.openweathermap.org/data/2.5/history/city?lat=${lat}&lon=${lon}&type=hour&start=${startUnixTimestamp}&end=${endUnixTimestamp}&appid=${apiKey}`
                        const historyResponse = await axios.get(url);
                        logger.info(`END : Weather Details On Dates : city = ${args.city} : from = ${args.from} to = ${args.to}`)
                        return historyResponse.data;
                    } else {
                        throw new Error(`${args.city} not found`);
                    }

                } catch (error) {
                    throw new Error('Error fetching city coordinates:', error.message)
                }
            }
        },
        fetchWeather: {
            type: WeatherType,
            args: { city: { type: GraphQLString } },
            async resolve(parent, args) {
                const apiKey = '350fac9a58f4dd3f0fedaea50a75c190';  // Replace with OpenWeatherMap API key               
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${args.city}&appid=${apiKey}&units=metric`;
                
                logger.info(`Calling Weather API On : city = ${args.city}`)
                const response = await axios.get(url)
                const data = response.data;
                if (data) {
                    try {
                        logger.info(`START : Fetch Weather Details : city = ${args.city}`)
                        /*
                        converting date to dd/MM/YYYY format
                        */
                        const date = new Date();
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        const currentDate = `${day}-${month}-${year}`;
                        // Save to the database
                        let savedWeatherData;
                        logger.info(`START : Saving Weather Details to DB : city = ${args.city}`)
                        const newWeather = new Weather({
                            city: data.name,
                            description: data.weather[0].description,
                            temperature: data.main.temp,
                            date: currentDate
                        });
                        await newWeather.save()
                            .then(weatherData => savedWeatherData = weatherData)
                            .catch(err => { throw new Error(err.message) })
                        logger.info(`END : Saving Weather Details to DB : city = ${args.city}`)
                        logger.info(`END : Fetch Weather Details : city = ${args.city}`)
                        return savedWeatherData;
                    } catch (error) {
                        console.error('Error fetching weather data:', error.message);
                        if (error.response && error.response.status === 404) {
                            throw new Error(`City "${args.city}" not found.`);
                        } else if (error.code === 'ENOTFOUND') {
                            throw new Error('Network error, unable to reach the weather service.');
                        } else {
                            throw new Error('An error occurred while fetching weather data.');
                        }

                    }
                }

            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery
});


