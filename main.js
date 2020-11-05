// load lobraries and modules
const express = require('express');
const handlebars = require('express-handlebars');
const fetch = require('node-fetch');
const withQuery = require('with-query').default;
const mysql = require('mysql2/promise');
const md5Hash = require('crypto-js/md5');

// configure the port to listen to, with default being 3000
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

// define some global constants
const QUERYLIMIT = 20;

// retrieve the API_KEY needed to run the queries
const PUB_API_KEY = process.env.PUB_API_KEY || "";
const PRI_API_KEY = process.env.PRI_API_KEY || "";
const baseUrl = "https://gateway.marvel.com:443";
const characterUrl = "/v1/public/characters";

let timeStamp = "1"; // alternatively, let timeStamp = (new Date()).getTime();
// const queryString = "https://gateway.marvel.com:443/v1/public/characters?ts=" + timeStamp + "&apikey=" + PUB_API_KEY + "&hash=" + md5Hash(timeStamp + PRI_API_KEY + PUB_API_KEY);

const generateQuery = (mainUrl) => {
    const newQuery = (ts, public_key, private_key) => {
        // const query = mainUrl + "?ts=" + ts + "&apikey=" + public_key + "&hash=" + md5Hash(ts + PRI_API_KEY + PUB_API_KEY);
        const query = withQuery(
            mainUrl, {
                ts: ts,
                apikey: public_key,
                hash: md5Hash(ts + PRI_API_KEY + PUB_API_KEY).toString()
            }
        );
        return query;
    }
    return newQuery;
}
const Marvel_Query_Character_List = generateQuery(baseUrl + characterUrl);

// create instance of the express server
const app = express();

// configure handlebars to work with express
app.engine('hbs', handlebars({ defaultLayout: 'default.hbs' }));
app.set('view engine', 'hbs');

// set up the routes using middlewares
app.get('/', async (req, res, next) => {
    // const results = await fetch(queryString);
    const results = await fetch(Marvel_Query_Character_List(timeStamp, PUB_API_KEY, PRI_API_KEY));

    try {
        const valReturned = await results.json();

        // debugging logs
        console.info("==> response obtained: ", valReturned);
        console.info("======================")
        console.info("==> character obtained: ", valReturned.data.results[0]);

        res.status(200).type('text/html');
        res.render('index', { character: valReturned.data.results, attribution: valReturned.attributionHTML });
    } catch (error) {
        console.error('==> An internal server error occurred');
        res.status(500).type('text/html');
        res.send('Internal Server error occurred');
    }
});

// start the server
if(PUB_API_KEY && PRI_API_KEY) {
    app.listen(PORT, () => {
        console.info(`Server was started on port ${PORT} at ${new Date()}`);
    });
} else {
    console.error('API Key is not set');
}