import { DB_NAME } from "../constants.js";
import chalk from "chalk";
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n${chalk.bgGreenBright(' MongoDB connected !!!')} | HOST: ${chalk.gray(connectInstance.connection.host)}`);
    } catch (error) {
        console.log("Error connecting to the database: ", error);
        process.exit(1);
    }
}

export default connectDB;