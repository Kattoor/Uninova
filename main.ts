/// <reference path="tsdefs/require.d.ts" />
/// <reference path="tsdefs/rx.d.ts" />

import {Building} from "./model/building";
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP ||'127.0.0.1';

import {UserManager} from "./dal/userManager";
import {User} from "./model/user";
import Observable = Rx.Observable;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var userManager: UserManager = new UserManager();

(userManager.connect() as Observable<any>).subscribe(() => {

    /*  register
        Inserts a new user document in the database.
        Requires a username and password field in the POST body.
        Returns the token on success, an empty string otherwise.
     */
    app.post('/api/user/register', (req, res) => userManager.createUser(req.body.username, req.body.password).subscribe((jwt: string) => res.json(jwt)));

    /*  login
        Searches for a user in the database by their username.
        Requires a username and password field in the POST body.
        If the username is found and the passwords match, the token is returned, if not, an empty string.
     */
    app.post('/api/user/login', (req, res) => userManager.login(req.body.username, req.body.password).subscribe((jwt: string) => res.json(jwt)));

    /*  nextday
        Gets called at the end of each day by the Unity client.
        Requires a token in the POST body to identify the user.
        Takes into account all the formula's necessary for the calculation of the mortality of the fishes.
        Returns the updated building data as an array of the type: Building.
     */
    app.post('/api/user/nextday', (req, res) => userManager.nextDay(req.body.token, req.body.buildings).subscribe((buildings: Building[]) => res.send(buildings)));

    /*  getdata
     */
    app.post('/api/user/getdata', (req, res) => userManager.getData(req.body.token).subscribe((user: User) => res.json(user)));

    /*  getneighbourdata
     */
    app.post('/api/user/getneighbourdata', (req, res) => userManager.getNeighbourData(req.body.token).subscribe((neighbours: User[]) => res.json(neighbours)));

    app.post('/api/user/savedata', (req, res) => userManager.saveData(req.body.token, JSON.parse(req.body.buildings)).subscribe(() => res.json("hi")));

    app.listen(server_port, server_ip_address, () => console.log("Server listening"));
});