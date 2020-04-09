const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const MongoDbConnectionString = require('./config/mongodb')
const authMiddleware = require("./middleware/auth");
const errorMiddleware = require("./middleware/error");
const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const PORT = 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.use("/auth",authRouter);
app.use("*",authMiddleware);
app.use('/users',userRouter);
app.use(errorMiddleware);

mongoose
    .connect(MongoDbConnectionString,{ useNewUrlParser: true , useUnifiedTopology: true})
    .then(result => {
        console.log("Connected to db");
        app.listen(PORT, () => {
            console.log("Server listening on Port: "+ PORT);
        });
    })
    .catch(err => {
        console.log(err);
    });


