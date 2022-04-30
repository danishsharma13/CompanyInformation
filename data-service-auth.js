const bcrypt = require('bcryptjs');
const mong = require("mongoose");

var Schema = mong.Schema;

// Defining Schema for a new 
var userSchema = new Schema({
  "userName":  {type: String, unique: true},
  "password": String,
  "email": String,
  "loginHistory": [ { dateTime: Date, userAgent: String } ]  
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = () => new Promise((res, rej) => {
    let db = mong.createConnection(
        "mongodb+srv://pastry_dough:<password>@senecaweb.0r4ko.mongodb.net/<database>?retryWrites=true&w=majority", 
        {useNewUrlParser: true, useUnifiedTopology: true}
    );
    db.on('error', (err) => {
        rej(err);
    });

    db.once('open', () => {
        User = db.model("users", userSchema);
        res();
    });
});

module.exports.registerUser = (userData) => new Promise((res, rej) => {
    if (userData.password == userData.password2) {
        bcrypt.genSalt(10)
            .then((salt) => bcrypt.hash(userData.password, salt))
            .then((hashPass) => {
                userData.password = hashPass;
                let newUser = new User(userData);
                newUser.save((err) => {
                    if(err && err.code == 11000) {
                        rej("User Name already taken.");
                    }
                    else if (err && err.code != 11000) {
                        rej(`There was an error creating the user: ${err}`);
                    } 
                    else {
                        res();
                    }
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }  
    else {
        rej("Passwords do not match.");
    }
});

module.exports.checkUser = (userData) => new Promise ((res, rej) => {
    User.find({userName: userData.userName})
        .exec()
        .then((uData) => {
            if (uData.length != 0) {
                bcrypt.compare(userData.password, uData[0].password)
                    .then((result) => {
                        if (result) {
                            if (!uData[0].loginHistory) uData[0].loginHistory = [];
                            uData[0].loginHistory.push({ 
                                dateTime: (new Date()).toString(), 
                                userAgent: userData.userAgent
                            });
                            User.update(
                                {userName: userData.userName},
                                { $set: {
                                    loginHistory: uData[0]
                                }}
                            )
                            .then(() => {
                                res(uData[0]);
                            })
                            .catch((err) => rej(`"There was an error verifying the user: ${err}`));
                        }
                        else {
                            rej(`Incorrect Password for user: ${userData.userName}`);
                        }
                    })
                    .catch((err) => rej(`"There was an error verifying the user: ${err}`));
            }
            else {
                rej(`Unable to find user: ${userData.userName}.`);
            }
        })
        .catch((err) => rej(`Unable to find user: ${userData.userName}.`));
});