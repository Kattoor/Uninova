/// <reference path="tsdefs/require.d.ts" />
/// <reference path="tsdefs/rx.d.ts" />
"use strict";
var dayInfo_1 = require("./model/history/dayInfo");
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var userManager_old_1 = require("./dal/userManager-old");
var user_1 = require("./model/user");
var buildingHistory_1 = require("./model/history/buildingHistory");
var bassinHistory_1 = require("./model/history/bassinHistory");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var userManager = new userManager_old_1.UserManager();
var dayInfo = new dayInfo_1.DayInfo("0", [
    new buildingHistory_1.BuildingHistory("Building 1", [
        new bassinHistory_1.BassinHistory("Fish type 1", 1),
        new bassinHistory_1.BassinHistory("Fish type 2", 2),
        new bassinHistory_1.BassinHistory("Fish type 3", 4),
        new bassinHistory_1.BassinHistory("Fish type 4", 8),
    ]),
    new buildingHistory_1.BuildingHistory("Building 2", [
        new bassinHistory_1.BassinHistory("Fish type 5", 16),
        new bassinHistory_1.BassinHistory("Fish type 6", 32),
        new bassinHistory_1.BassinHistory("Fish type 7", 64),
        new bassinHistory_1.BassinHistory("Fish type 8", 128),
    ])
]);
//console.log(JSON.stringify(dayInfo));
userManager.connect().subscribe(function () {
    //deleteAll();
    app.post('/api/user/register', function (req, res) { return userManager.createUser(new user_1.User(req.body.username, req.body.password, "0", 0, true, JSON.parse(req.body.buildings))).subscribe(function (b) { return res.json(b); }); });
    app.get('/api/user/find', function (req, res) { return userManager.readUser(req.query.username).subscribe(function (user) { return res.json(user); }); });
    app.post('/api/user/login', function (req, res) { return userManager.login(new user_1.User(req.body.username, req.body.password)).subscribe(function (jwt) { return res.send(jwt == null ? "wrong credentials" : jwt); }); });
    app.post('/api/user/getData', function (req, res) { return userManager.getData(req.body.token, req.body.from).subscribe(function (data) { return res.json(data); }); });
    app.post('/api/user/saveData', function (req, res) { return userManager.saveData(req.body.token, JSON.parse(req.body.buildings)).subscribe(function (data) { return res.json(data); }); });
    app.get('/api/user/dummy', function (req, res) { return (userManager.getDummyData(req.query.type).subscribe(function (text) { return res.send(text); })); });
    app.post('/api/user/getNeighbours', function (req, res) { return (userManager.getNeighbours(req.body.token).subscribe(function (neighbours) { return res.send(neighbours); })); });
    app.post('/api/user/saveDay', function (req, res) { return (userManager.dayPassed(req.body.token, new dayInfo_1.DayInfo(JSON.parse(req.body.dayInfo).day, JSON.parse(req.body.dayInfo).buildingHistories)).subscribe(function () { return res.send("ok"); })); });
    app.post('/api/user/getHistory', function (req, res) { return (userManager.getHistory(req.body.token).subscribe(function (history) { return res.send(history); })); });
    app.listen(server_port, server_ip_address, function () { return console.log("Server listening"); });
});
function deleteAll() {
    userManager.readUsers().subscribe(function (result) {
        result.forEach(function (user) {
            console.log(user.username);
            userManager.deleteUser(user.username);
        });
    });
}
/*
*


{
    "token": "hi",
    "dayInfo": {
        "buildingHistories":
        [
            {
                "name": "first building",
                "bassinHistories":
                [
                    {
                        "fishType": "Cod",
                        "amountOfFish": 100
                    }
                ]
            }
        ]
    }
}




*
* */ 
//# sourceMappingURL=main-old.js.map