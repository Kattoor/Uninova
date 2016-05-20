/// <reference path="tsdefs/require.d.ts" />
/// <reference path="tsdefs/rx.d.ts" />
"use strict";
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var userManager_1 = require("./dal/userManager");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var userManager = new userManager_1.UserManager();
userManager.connect().subscribe(function () {
    /*  register
        Inserts a new user document in the database.
        Requires a username and password field in the POST body.
        Returns the token on success, an empty string otherwise.
     */
    app.post('/api/user/register', function (req, res) { return userManager.createUser(req.body.username, req.body.password).subscribe(function (jwt) { return res.json(jwt); }); });
    /*  login
        Searches for a user in the database by their username.
        Requires a username and password field in the POST body.
        If the username is found and the passwords match, the token is returned, if not, an empty string.
     */
    app.post('/api/user/login', function (req, res) { return userManager.login(req.body.username, req.body.password).subscribe(function (jwt) { return res.json(jwt); }); });
    /*  nextday
        Gets called at the end of each day by the Unity client.
        Requires a token in the POST body to identify the user.
        Takes into account all the formula's necessary for the calculation of the mortality of the fishes.
        Returns the updated building data as an array of the type: Building.
     */
    app.post('/api/user/nextday', function (req, res) { return userManager.nextDay(req.body.token, req.body.buildings).subscribe(function (buildings) { return res.send(buildings); }); });
    /*  getdata
     */
    app.post('/api/user/getdata', function (req, res) { return userManager.getData(req.body.token).subscribe(function (user) { return res.json(user); }); });
    /*  getneighbourdata
     */
    app.post('/api/user/getneighbourdata', function (req, res) { return userManager.getNeighbourData(req.body.token).subscribe(function (neighbours) { return res.json(neighbours); }); });
    app.post('/api/user/savedata', function (req, res) { return userManager.saveData(req.body.token, JSON.parse(req.body.buildings)).subscribe(function () { return res.json("hi"); }); });
    app.listen(server_port, server_ip_address, function () { return console.log("Server listening"); });
});
//# sourceMappingURL=main.js.map