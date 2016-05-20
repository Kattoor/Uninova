/// <reference path="tsdefs/require.d.ts" />
/// <reference path="tsdefs/rx.d.ts" />

import {DayInfo} from "./model/history/dayInfo";
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP ||'127.0.0.1';

import {UserManager} from "./dal/userManager-old";
import {User} from "./model/user";
import Observable = Rx.Observable;
import {InsertOneWriteOpResult} from "mongodb";
import {CursorResult} from "mongodb";
import {BuildingHistory} from "./model/history/buildingHistory";
import {BassinHistory} from "./model/history/bassinHistory";
import {TokenManager} from "./TokenManager";
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var userManager: UserManager = new UserManager();


var dayInfo: DayInfo = new DayInfo("0", [
    new BuildingHistory("Building 1", [
        new BassinHistory("Fish type 1", 1),
        new BassinHistory("Fish type 2", 2),
        new BassinHistory("Fish type 3", 4),
        new BassinHistory("Fish type 4", 8),
    ]),
    new BuildingHistory("Building 2", [
        new BassinHistory("Fish type 5", 16),
        new BassinHistory("Fish type 6", 32),
        new BassinHistory("Fish type 7", 64),
        new BassinHistory("Fish type 8", 128),
    ])
]);

//console.log(JSON.stringify(dayInfo));


(userManager.connect() as Observable<any>).subscribe(() => {

    //deleteAll();

    app.post('/api/user/register', (req, res) => (userManager.createUser(new User(req.body.username, req.body.password, "0", 0, true, JSON.parse(req.body.buildings))) as Observable<boolean>).subscribe((b) => res.json(b)));
    app.get('/api/user/find', (req, res) => (userManager.readUser(req.query.username) as Observable<CursorResult>).subscribe((user) => res.json(user)));
    app.post('/api/user/login', (req, res) => (userManager.login(new User(req.body.username, req.body.password)) as Observable<string>).subscribe((jwt) => res.send(jwt == null ? "wrong credentials" : jwt)));
    app.post('/api/user/getData', (req, res) => (userManager.getData(req.body.token, req.body.from) as Observable<any>).subscribe((data) => res.json(data)));
    app.post('/api/user/saveData', (req, res) => (userManager.saveData(req.body.token, JSON.parse(req.body.buildings)) as Observable<any>).subscribe((data) => res.json(data)));
    app.get('/api/user/dummy', (req, res) => (userManager.getDummyData(req.query.type).subscribe((text) => res.send(text))));
    app.post('/api/user/getNeighbours', (req, res) => (userManager.getNeighbours(req.body.token).subscribe((neighbours) => res.send(neighbours))));
    app.post('/api/user/saveDay', (req, res) => (userManager.dayPassed(req.body.token, new DayInfo(JSON.parse(req.body.dayInfo).day, JSON.parse(req.body.dayInfo).buildingHistories)).subscribe(() => res.send("ok"))));
    app.post('/api/user/getHistory', (req, res) => (userManager.getHistory(req.body.token).subscribe((history) => res.send(history))));
    app.listen(server_port, server_ip_address, () => console.log("Server listening"));

});

function deleteAll() {
    userManager.readUsers().subscribe((result: User[]) => {
        result.forEach(user => {
            console.log(user.username);
            userManager.deleteUser(user.username);
        })
    })
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