/// <reference path="../tsdefs/mongodb.d.ts" />
/// <reference path="../tsdefs/rx.d.ts" />
"use strict";
var ReactiveX = require('rx'); // don't delete!
var user_1 = require("../model/user");
var Observable = ReactiveX.Observable;
var TokenManager_1 = require("../TokenManager");
var storm_1 = require("../model/storm");
var UserManager = (function () {
    function UserManager() {
        this.mongoClient = require('mongodb').MongoClient;
        this.url = 'mongodb://Uninova:uninova4@ds011422.mlab.com:11422/uninova';
    }
    UserManager.prototype.connect = function () {
        var _this = this;
        var observable = Observable.fromPromise(this.mongoClient.connect(this.url));
        observable.subscribe(function (db) {
            _this.db = db;
            _this.userCollection = db.collection("users");
            _this.historyCollection = db.collection("history");
        });
        return observable;
    };
    /*  createUser
        We try to find a user with the corresponding username in the collection to see if the username is already taken.
        If not, we create a new user object and set it's registeredNumber value to the current amount of users in the collection.
        This user object gets inserted in the collection as a new document.
        Finally we pass the user object to the TokenManager to generate a token which will be passed to the client for future authentication.
     */
    UserManager.prototype.createUser = function (username, password) {
        var _this = this;
        return Observable.create(function (observer) {
            _this.readUser(username).subscribe(function (readUser) {
                if (readUser == null) {
                    Observable.fromPromise(_this.userCollection.count({})).subscribe(function (count) {
                        var storms; // = this.getRandomStorms();
                        var user = new user_1.User(username, password, "1", count, false, [], []);
                        Observable.fromPromise(_this.userCollection.insertOne(user)).subscribe(function () {
                            return observer.onNext(TokenManager_1.TokenManager.tokenify(user));
                        });
                    });
                }
                else
                    observer.onNext("");
            });
        });
    };
    /*  login
        We read the user from the collection by their username.
        If the passwords match we return the user's token for future authentication, otherwise an empty string.
     */
    UserManager.prototype.login = function (username, password) {
        var _this = this;
        return Observable.create(function (observer) {
            return _this.readUser(username).subscribe(function (user) {
                return observer.onNext(user != null && user.password.localeCompare(password) == 0 ? TokenManager_1.TokenManager.tokenify(user) : "");
            });
        });
    };
    //First: save received buildings to user's history
    //Second: change bassins and mortality and such
    //Third: incrDayForUser
    UserManager.prototype.nextDay = function (token, buildings) {
        var _this = this;
        return Observable.create(function (observer) {
            var username = TokenManager_1.TokenManager.getField(token, "username");
            if (TokenManager_1.TokenManager.validate(token)) {
                Observable.fromPromise(_this.userCollection.find({ username: username }).limit(1).next()).map(function (doc) { return doc.day; }).subscribe(function (currentDay) {
                    _this.saveAsHistoryFor(username, currentDay, JSON.parse(buildings)).subscribe(// save history
                    function () {
                        _this.updateUserBuildings(token, JSON.parse(buildings)).subscribe(// save user
                        function () {
                            // change bassins and mortality and such
                            var parsedBuildings = JSON.parse(buildings);
                            if (parsedBuildings != null && parsedBuildings.length > 0) {
                                for (var _i = 0, parsedBuildings_1 = parsedBuildings; _i < parsedBuildings_1.length; _i++) {
                                    var building = parsedBuildings_1[_i];
                                    if (building.bassins != null && building.bassins.length > 0) {
                                        for (var _a = 0, _b = building.bassins; _a < _b.length; _a++) {
                                            var bassin = _b[_a];
                                            bassin.amountOfFishes -= _this.calculateFatalities(bassin);
                                        }
                                    }
                                }
                            }
                            console.log("oh hello is it me you're looking for");
                            _this.incrDayForUser(username, +currentDay).subscribe(function () { return observer.onNext(parsedBuildings); });
                        });
                    });
                });
            }
            else
                observer.onNext(null);
        });
    };
    //gets called when user adds buildings in overview then hits escape
    UserManager.prototype.saveData = function (token, buildings) {
        var _this = this;
        return Observable.create(function (observer) {
            if (TokenManager_1.TokenManager.validate(token)) {
                var requestingUsername = TokenManager_1.TokenManager.getField(token, "username");
                Observable.fromPromise(_this.userCollection.updateOne({ username: requestingUsername }, { $set: { buildings: buildings } }, {})).subscribe(function (result) { return observer.onNext(result.modifiedCount); });
            }
        });
    };
    UserManager.prototype.incrDayForUser = function (username, currentDay) {
        var _this = this;
        return Observable.create(function (observer) {
            Observable.fromPromise(_this.userCollection.updateOne({ username: username }, { $set: { day: currentDay + 1 } }, {})).subscribe(function (result) {
                return observer.onNext(result);
            } //result is omitted
             //result is omitted
            );
        });
    };
    //Does history already exist for this user?
    //  no -> create one and insert data we received
    //  yes -> insert data we received in 'days' collection of user's history
    UserManager.prototype.saveAsHistoryFor = function (username, currentDay, buildings) {
        var _this = this;
        return Observable.create(function (observer) {
            var dayInfo = {};
            dayInfo["day"] = currentDay;
            dayInfo["buildingHistories"] = buildings;
            Observable.fromPromise(_this.historyCollection.count({ username: username })).subscribe(function (count) {
                if (count == 0) {
                    Observable.fromPromise(_this.historyCollection.insertOne({ username: username, days: [dayInfo] })).subscribe(function () {
                        console.log("Finished creating");
                        observer.onNext("sup");
                    });
                }
                else {
                    Observable.fromPromise(_this.historyCollection.findOneAndUpdate({ username: username }, { $push: { days: dayInfo } })).subscribe(function () {
                        console.log("Finished inserting");
                        observer.onNext(true);
                    });
                }
            });
        });
    };
    /*  getData
        This method gets invoked when the user is logged in.
        Returns the user's document from the database which also contains buildings, bassins and storms.
     */
    UserManager.prototype.getData = function (token) {
        var _this = this;
        return Observable.create(function (observer) {
            if (TokenManager_1.TokenManager.validate(token)) {
                var username = TokenManager_1.TokenManager.getField(token, "username");
                _this.readUser(username).subscribe(function (user) {
                    return observer.onNext(user);
                });
            }
            else
                observer.onNext(null);
        });
    };
    UserManager.prototype.getNeighbourData = function (token) {
        var _this = this;
        return Observable.create(function (observer) {
            if (TokenManager_1.TokenManager.validate(token)) {
                var registeredNumber = TokenManager_1.TokenManager.getField(token, "registeredNumber");
                var neighbours = [];
                Observable.create(function (observerLeftNeighbour) {
                    if (+registeredNumber > 0)
                        _this.getDataFromRegisteredNumber(registeredNumber - 1).subscribe(function (leftNeighbour) { return observerLeftNeighbour.onNext(leftNeighbour); });
                    else
                        observerLeftNeighbour.onNext(null);
                }).subscribe(function (leftNeighbour) {
                    neighbours[0] = leftNeighbour;
                    Observable.create(function (observerRightNeighbour) {
                        Observable.fromPromise(_this.userCollection.count({})).subscribe(function (count) {
                            if (+registeredNumber < count - 1)
                                _this.getDataFromRegisteredNumber(registeredNumber + 1).subscribe(function (rightNeighbour) { return observerRightNeighbour.onNext(rightNeighbour); });
                            else
                                observerRightNeighbour.onNext(null);
                        });
                    }).subscribe(function (rightNeighbour) {
                        neighbours[1] = rightNeighbour;
                        observer.onNext(neighbours);
                    });
                });
            }
        });
    };
    UserManager.prototype.updateUserBuildings = function (token, buildings) {
        var _this = this;
        return Observable.create(function (observer) {
            if (TokenManager_1.TokenManager.validate(token)) {
                var username = TokenManager_1.TokenManager.getField(token, "username");
                Observable.fromPromise(_this.userCollection.updateOne({ username: username }, { $set: { buildings: buildings } }, {})).subscribe(function (result) { return observer.onNext(true); });
            }
            else
                observer.onNext(false);
        });
    };
    UserManager.prototype.readUser = function (username) {
        return Observable.fromPromise(this.userCollection.find({ username: username }).limit(1).next()).map(function (doc) {
            return doc == null ? null : new user_1.User(doc.username, doc.password, doc.day, doc.registeredNumber, doc.hasAquaSmart, doc.buildings, doc.storms, doc._id);
        });
    };
    UserManager.prototype.getRandomStorms = function () {
        var storms = [];
        var amountOfStorms = Math.floor(Math.random() * 5) + 1; // 1 to 6 (inclusive) storms a year
        var randomAlreadyTaken;
        while (storms.length < amountOfStorms) {
            randomAlreadyTaken = false;
            var randomDay = Math.floor(Math.random() * 364) + 1;
            for (var i = 0; i < storms.length; i++) {
                if (storms[i].day == randomDay) {
                    randomAlreadyTaken = true;
                    break;
                }
            }
            if (randomAlreadyTaken)
                continue;
            var randomGravity = Math.floor(Math.random() * 9) + 1;
            storms.push(new storm_1.Storm(randomGravity, randomDay));
        }
        return storms;
    };
    UserManager.prototype.getDataFromRegisteredNumber = function (registeredNumber) {
        var _this = this;
        return Observable.create(function (observer) {
            Observable.fromPromise(_this.userCollection.find({ registeredNumber: registeredNumber }).limit(1).next()).map(function (doc) {
                return doc == null ? null : new user_1.User(doc.username, "nice try ;)", doc.day, doc.registeredNumber, doc.hasAquaSmart, doc.buildings, doc._id);
            }).subscribe(function (user) { return observer.onNext(user); });
        });
    };
    UserManager.prototype.calculateFatalities = function (bassin) {
        //todo average weight & feeding ook
        return 4;
    };
    return UserManager;
}());
exports.UserManager = UserManager;
//# sourceMappingURL=userManager.js.map