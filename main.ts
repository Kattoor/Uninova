/// <reference path="tsdefs/require.d.ts" />
/// <reference path="tsdefs/rx.d.ts" />

import {UserManager} from "./dal/userManager";
import {User} from "./model/user";
import Observable = Rx.Observable;
import {InsertOneWriteOpResult} from "mongodb";
import {CursorResult} from "mongodb";
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var userManager: UserManager = new UserManager();
(userManager.connect() as Observable<any>).subscribe(() => {

    //deleteAll();

    app.post('/api/user/register', (req, res) => (userManager.createUser(new User(req.body.username, req.body.password, 0, true, JSON.parse(req.body.buildings))) as Observable<boolean>).subscribe((b) => res.json(b)));
    app.get('/api/user/find', (req, res) => (userManager.readUser(req.query.username) as Observable<CursorResult>).subscribe((user) => res.json(user)));
    app.post('/api/user/login', (req, res) => (userManager.login(new User(req.body.username, req.body.password)) as Observable<string>).subscribe((jwt) => res.send(jwt == null ? "wrong credentials" : jwt)));
    app.post('/api/user/getData', (req, res) => (userManager.getData(req.body.token, req.body.from) as Observable<any>).subscribe((data) => res.json(data)));
    app.post('/api/user/saveData', (req, res) => (userManager.saveData(req.body.token, JSON.parse(req.body.buildings)) as Observable<any>).subscribe((data) => res.json(data)));
    app.get('/api/user/dummy', (req, res) => (userManager.getDummyData(req.query.type).subscribe((text) => res.send(text))));
    app.post('/api/user/getNeighbours', (req, res) => (userManager.getNeighbours(req.body.token).subscribe((neighbours) => res.send(neighbours))));

    app.listen(3000, () => console.log("Server listening on port 3000"));

});

function deleteAll() {
    userManager.readUsers().subscribe((result: User[]) => {
        result.forEach(user => {
            console.log(user.username);
            userManager.deleteUser(user.username);
        })
    })
}