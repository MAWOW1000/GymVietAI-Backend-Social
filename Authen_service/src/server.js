require("dotenv").config();
import express from "express";
import initApiRoutes from "./routes/api";
import configCors from "./config/cors";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import connection from "./config/connectDB";


const app = express();
const PORT = process.env.PORT || 8083;

//config cors
configCors(app);


//config body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//config cookie -parser
app.use(cookieParser());

//test connection db
connection();


//init routes
initApiRoutes(app);

//req => middleware => res
app.use((req, res) => {
    return res.send('404 not found')
})

app.listen(PORT, () => {
    console.log(">>> JWT Backend is running on the port = " + PORT);
})