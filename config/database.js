import mongoose from 'mongoose';
import config from '.'; // get db config file

const { ObjectId } = mongoose.Types;
ObjectId.prototype.valueOf = function () {
  return this.toString()
}


mongoose.conn = mongoose.createConnection(config.db_uri, config.db_options);

/**
 * MONGODB MAIN CONNECTION
 */
mongoose.conn.on('connecting', () => console.log(`Mongoose ${config.db_uri} connection connecting`));
mongoose.conn.on('connected', () => console.log(`Mongoose ${config.db_uri} connection connected`));
mongoose.conn.on('error', err => console.log(`Mongoose ${config.db_uri} connection error: ${err}`));
mongoose.conn.on('disconnected', () => console.log(`Mongoose ${config.db_uri} connection disconnected`));

/**
 * MONGODB TERMINATE CONNECTION
 */
// 강제종료시 커넥션 종료
process.on('SIGINT', () => {
    mongoose.main_conn.close(() => console.log('Mongoose default connection disconnected through app termination'));
    mongoose.logger_conn.close(() => {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit();
    });
});

export default mongoose;
