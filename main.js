/// <reference path="tsdefs/require.d.ts" />
/// <reference path="tsdefs/rx.d.ts" />
"use strict";
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var userManager_1 = require("./dal/userManager");
var user_1 = require("./model/user");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var userManager = new userManager_1.UserManager();
userManager.connect().subscribe(function () {
    //deleteAll();
    app.post('/api/user/register', function (req, res) { return userManager.createUser(new user_1.User(req.body.username, req.body.password, 0, true, JSON.parse(req.body.buildings))).subscribe(function (b) { return res.json(b); }); });
    app.get('/api/user/find', function (req, res) { return userManager.readUser(req.query.username).subscribe(function (user) { return res.json(user); }); });
    app.post('/api/user/login', function (req, res) { return userManager.login(new user_1.User(req.body.username, req.body.password)).subscribe(function (jwt) { return res.send(jwt == null ? "wrong credentials" : jwt); }); });
    app.post('/api/user/getData', function (req, res) { return userManager.getData(req.body.token, req.body.from).subscribe(function (data) { return res.json(data); }); });
    app.post('/api/user/saveData', function (req, res) { return userManager.saveData(req.body.token, JSON.parse(req.body.buildings)).subscribe(function (data) { return res.json(data); }); });
    app.get('/api/user/dummy', function (req, res) { return (userManager.getDummyData(req.query.type).subscribe(function (text) { return res.send(text); })); });
    app.post('/api/user/getNeighbours', function (req, res) { return (userManager.getNeighbours(req.body.token).subscribe(function (neighbours) { return res.send(neighbours); })); });
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
//# sourceMappingURL=main.js.map