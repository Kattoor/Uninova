/// <reference path="../tsdefs/mongodb.d.ts" />
/// <reference path="../tsdefs/rx.d.ts" />
"use strict";
var ReactiveX = require('rx'); // don't delete!
var user_1 = require("../model/user");
var Observable = ReactiveX.Observable;
var TokenManager_1 = require("../TokenManager");
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
            _this.collection = db.collection("users");
        });
        return observable;
    };
    UserManager.prototype.createUser = function (user) {
        var _this = this;
        return Observable.create(function (observer) {
            _this.readUser(user.username).subscribe(function (readUser) {
                if (readUser == null) {
                    Observable.fromPromise(_this.collection.count({})).subscribe(function (count) {
                        user.registeredNumber = count;
                        Observable.fromPromise(_this.collection.insertOne(user)).subscribe(function () { return observer.onNext(true); });
                    });
                }
                else
                    observer.onNext(false);
            });
        });
    };
    UserManager.prototype.saveData = function (token, buildings) {
        var _this = this;
        return Observable.create(function (observer) {
            if (TokenManager_1.TokenManager.validate(token)) {
                var requestingUsername = TokenManager_1.TokenManager.getField(token, "username");
                Observable.fromPromise(_this.collection.updateOne({ username: requestingUsername }, { $set: { buildings: buildings } }, {})).subscribe(function (result) { return observer.onNext(result.modifiedCount); });
            }
        });
    };
    UserManager.prototype.readUser = function (username) {
        return Observable.fromPromise(this.collection.find({ username: username }).limit(1).next()).map(function (doc) {
            return doc == null ? null : new user_1.User(doc.username, doc.password, doc.registeredNumber, doc.hasAquaSmart, doc.buildings, doc._id);
        });
    };
    UserManager.prototype.readUsers = function () {
        var _this = this;
        var users = [];
        return Observable.create(function (observer) {
            return _this.collection.find({}).forEach(function (document) {
                return users.push(document);
            }, function () {
                return observer.onNext(users);
            });
        });
    };
    UserManager.prototype.deleteUser = function (username) {
        this.collection.deleteMany({ username: username });
    };
    UserManager.prototype.login = function (user) {
        var _this = this;
        return Observable.create(function (observer) {
            return _this.readUser(user.username).subscribe(function (readUser) {
                return observer.onNext(readUser != null && user.password.localeCompare(readUser.password) == 0 ? TokenManager_1.TokenManager.tokenify(readUser) : null);
            });
        });
    };
    /*public addBuilding(token: string, building: Building): Observable<boolean> {
        //var name: string = TokenManager.getField(token, "name");
        if (TokenManager.validate(token)) {

        }
        

    }*/
    UserManager.prototype.getDummyData = function (type) {
        var collection = this.db.collection("dummydata");
        return Observable.fromPromise(collection.find({ type: type }).limit(1).next()).map(function (doc) {
            return doc == null ? null : doc.content;
        });
    };
    UserManager.prototype.getDataFromRegisteredNumber = function (token, registeredNumber) {
        var _this = this;
        return Observable.create(function (observer) {
            if (TokenManager_1.TokenManager.validate(token)) {
                Observable.fromPromise(_this.collection.find({ registeredNumber: registeredNumber }).limit(1).next()).map(function (doc) {
                    return doc == null ? null : new user_1.User(doc.username, "nice try ;)", doc.registeredNumber, doc.hasAquaSmart, doc.buildings, doc._id);
                }).subscribe(function (user) { return observer.onNext(user); });
            }
        });
    };
    UserManager.prototype.getData = function (token, from) {
        var _this = this;
        return Observable.create(function (observer) {
            if (TokenManager_1.TokenManager.validate(token)) {
                var requestingUsername = TokenManager_1.TokenManager.getField(token, "username");
                _this.readUser(requestingUsername).subscribe(function (requestingUser) {
                    if (requestingUser.hasAquaSmart)
                        _this.readUser(from).subscribe(function (requestedUser) { return observer.onNext(requestedUser); });
                    else
                        observer.onNext("User hasn't got AquaSmart system");
                });
            }
        });
    };
    UserManager.prototype.getNeighbours = function (token) {
        var _this = this;
        return Observable.create(function (observer) {
            if (TokenManager_1.TokenManager.validate(token)) {
                var registeredNumber = TokenManager_1.TokenManager.getField(token, "registeredNumber");
                var neighbours = [];
                Observable.create(function (observerNeighbour1) {
                    if ((+registeredNumber) > 0)
                        _this.getDataFromRegisteredNumber(token, (+registeredNumber) - 1).subscribe(function (user) { return observerNeighbour1.onNext(user); });
                    else
                        observerNeighbour1.onNext(null);
                }).subscribe(function (user) {
                    neighbours[0] = user;
                    Observable.fromPromise(_this.collection.count({})).subscribe(function (count) {
                        if ((+registeredNumber) < (count - 1)) {
                            _this.getDataFromRegisteredNumber(token, (+registeredNumber) + 1).subscribe(function (user) {
                                neighbours[1] = user;
                                observer.onNext(neighbours);
                            });
                        }
                        else {
                            neighbours[1] = null;
                            observer.onNext(neighbours);
                        }
                    });
                });
            }
        });
    };
    return UserManager;
}());
exports.UserManager = UserManager;
//# sourceMappingURL=userManager.js.map