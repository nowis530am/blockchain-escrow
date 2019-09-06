require('dotenv').config();

const config = {
    db_uri: process.env.DB_URI,
    db_options: {
        user: process.env.DB_USERNAME,
        pass: process.env.DB_PASS,
        // dbName: process.env.DB_DBNAME,
        // auth: {
        //     authdb: process.env.DB_DBNAME,
        // },
        useCreateIndex: true,
        useNewUrlParser: true,
    },
};

export default config;
