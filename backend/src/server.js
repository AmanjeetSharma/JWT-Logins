import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import chalk from "chalk";

dotenv.config({
    path: "./.env"
});


app.get("/", (req, res) => {
    res.send('<h1 style="color:red; background:#39FF14; text-align:center;">Hello, World!</h1>');
});

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 6000, () => {
            console.log(chalk.yellowBright(`Server is live! 🚀`));
            console.log(chalk.magentaBright(`🌐 Server is running on port:`));
            console.log(chalk.cyanBright(`http://localhost:${process.env.PORT || 6000}`));
            console.log(chalk.gray(`-----------------------------------------`));
        });
    })
    .catch((error) => {
        console.log("MongoDB Connection failed: ", error);
    });

