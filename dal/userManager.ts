/// <reference path="../tsdefs/mongodb.d.ts" />
/// <reference path="../tsdefs/rx.d.ts" />

import * as ReactiveX from 'rx'; // don't delete!
import {User} from "../model/user";
import {Collection} from "mongodb";
import {MongoClient} from "mongodb";
import {Db} from "mongodb";
import {InsertOneWriteOpResult} from "mongodb";
import {CursorResult} from "mongodb";
import Observable = ReactiveX.Observable;
import Subject = ReactiveX.Subject;
import {TokenManager} from "../TokenManager";
import {Bassin} from "../model/bassin";
import {Storm} from "../model/storm";
import {Building} from "../model/building";
import {UpdateWriteOpResult} from "mongodb";

export class UserManager {

    private mongoClient: MongoClient;
    private url: string;
    private userCollection: Collection;
    private historyCollection: Collection;
    private db: Db;

    constructor() {
        this.mongoClient = require('mongodb').MongoClient;
        this.url = 'mongodb://Uninova:uninova4@ds011422.mlab.com:11422/uninova';
    }

    public connect(): Observable<Db> {
        var observable: Observable<Db> = Observable.fromPromise<Db>(this.mongoClient.connect(this.url));
        observable.subscribe(
            (db: Db) => {
                this.db = db;
                this.userCollection = db.collection("users");
                this.historyCollection = db.collection("history");
            }
        );
        return observable;
    }

    /*  createUser
        We try to find a user with the corresponding username in the collection to see if the username is already taken.
        If not, we create a new user object and set it's registeredNumber value to the current amount of users in the collection.
        This user object gets inserted in the collection as a new document.
        Finally we pass the user object to the TokenManager to generate a token which will be passed to the client for future authentication.
     */
    public createUser(username: string, password: string): Observable<string> {
        return Observable.create<string>(
            observer => {
                this.readUser(username).subscribe(
                    readUser => {
                        if (readUser == null) {
                            Observable.fromPromise<number>(this.userCollection.count({})).subscribe(count => {
                                var storms: Storm[];// = this.getRandomStorms();
                                var user: User = new User(username, password, "1", count, false, [], []);
                                Observable.fromPromise<InsertOneWriteOpResult>(this.userCollection.insertOne(user)).subscribe(
                                    () =>
                                        observer.onNext(TokenManager.tokenify(user)));
                            });
                        } else observer.onNext("");
                    }
                );
            }
        );
    }

    /*  login
        We read the user from the collection by their username.
        If the passwords match we return the user's token for future authentication, otherwise an empty string.
     */
    public login(username: string, password: string): Observable<string> {
        return Observable.create<string>(
            observer =>
                this.readUser(username).subscribe(
                    (user) =>
                        observer.onNext(user != null && user.password.localeCompare(password) == 0 ? TokenManager.tokenify(user) : "")
                )
        );
    }

    //First: save received buildings to user's history
    //Second: change bassins and mortality and such
    //Third: incrDayForUser
    public nextDay(token: string, buildings: string): Observable<Building[]> {
        return Observable.create<Building[]>(
            observer => {
                var username: string = TokenManager.getField(token, "username");
                if (TokenManager.validate(token)) {
                    Observable.fromPromise<CursorResult>(this.userCollection.find({username: username}).limit(1).next()).map(doc => doc.day).subscribe(
                        currentDay => {
                            this.saveAsHistoryFor(username, currentDay, JSON.parse(buildings)).subscribe( // save history
                                () => {
                                    this.updateUserBuildings(token, JSON.parse(buildings)).subscribe( // save user
                                        () => {
                                             // change bassins and mortality and such
                                            var parsedBuildings: Building[] = JSON.parse(buildings);
                                            if (parsedBuildings != null && parsedBuildings.length > 0) {
                                                for (var building of parsedBuildings) {
                                                    if (building.bassins != null && building.bassins.length > 0) {
                                                        for (var bassin of building.bassins)
                                                            bassin.amountOfFishes -= this.calculateFatalities(bassin);
                                                    }
                                                }
                                            }
                                            console.log("oh hello is it me you're looking for")
                                            this.incrDayForUser(username, +currentDay).subscribe(() => observer.onNext(parsedBuildings));
                                        }
                                    );
                                }
                            );
                        }
                    );
                } else
                    observer.onNext(null);
            }
        );
    }

    //gets called when user adds buildings in overview then hits escape
    public saveData(token: string, buildings: Building[]): Observable<any> {
        return Observable.create<any>(
            observer => {
                if (TokenManager.validate(token)) {
                    var requestingUsername:string = TokenManager.getField(token, "username");
                    Observable.fromPromise<UpdateWriteOpResult>(this.userCollection.updateOne({username: requestingUsername}, {$set: {buildings: buildings}}, {})).subscribe((result:UpdateWriteOpResult) => observer.onNext(result.modifiedCount));
                }
            }
        );
    }

    private incrDayForUser(username: string, currentDay: number): Observable<any> {
        return Observable.create<any>(
            observer => {
                Observable.fromPromise<UpdateWriteOpResult>(this.userCollection.updateOne({username: username}, {$set: {day: currentDay + 1}}, {})).subscribe(
                    (result:UpdateWriteOpResult) =>
                        observer.onNext(result) //result is omitted
                );
            }
        );
    }

    //Does history already exist for this user?
    //  no -> create one and insert data we received
    //  yes -> insert data we received in 'days' collection of user's history
    private saveAsHistoryFor(username: string, currentDay: number, buildings: Building[]): Observable<any> {
        return Observable.create<any>(
            observer => {
                var dayInfo = {};
                dayInfo["day"] = currentDay;
                dayInfo["buildingHistories"] = buildings;
                Observable.fromPromise<number>(this.historyCollection.count({username: username})).subscribe(count => {
                    if (count == 0) {
                        Observable.fromPromise<InsertOneWriteOpResult>(this.historyCollection.insertOne({username: username, days: [dayInfo]})).subscribe(() => {
                            console.log("Finished creating");
                            observer.onNext("sup")
                        });
                    } else {
                        Observable.fromPromise<any>(this.historyCollection.findOneAndUpdate({username: username}, { $push: {days: dayInfo}})).subscribe(() => {
                            console.log("Finished inserting");
                            observer.onNext(true);
                        });
                    }
                });
            }
        );
    }

    /*  getData
        This method gets invoked when the user is logged in.
        Returns the user's document from the database which also contains buildings, bassins and storms.
     */
    public getData(token: string): Observable<User> {
        return Observable.create<User>(
            observer => {
                if (TokenManager.validate(token)) {
                    var username: string = TokenManager.getField(token, "username");
                    this.readUser(username).subscribe(
                        (user: User) =>
                            observer.onNext(user)
                    );
                } else
                    observer.onNext(null);
            }
        );
    }

    public getNeighbourData(token: string): Observable<User[]> {
        return Observable.create<User[]>(
            observer => {
                if (TokenManager.validate(token)) {
                    var registeredNumber = TokenManager.getField(token, "registeredNumber");
                    var neighbours: User[] = [];
                    Observable.create<User>(
                        observerLeftNeighbour => {
                            if (+registeredNumber > 0)
                                this.getDataFromRegisteredNumber(registeredNumber - 1).subscribe((leftNeighbour: User) => observerLeftNeighbour.onNext(leftNeighbour));
                            else
                                observerLeftNeighbour.onNext(null);
                        }
                    ).subscribe((leftNeighbour: User) => {
                        neighbours[0] = leftNeighbour;
                        Observable.create<User>(
                            observerRightNeighbour => {
                                Observable.fromPromise<number>(this.userCollection.count({})).subscribe(count => {
                                    if (+registeredNumber < count - 1)
                                        this.getDataFromRegisteredNumber(registeredNumber + 1).subscribe((rightNeighbour: User) => observerRightNeighbour.onNext(rightNeighbour));
                                    else
                                        observerRightNeighbour.onNext(null);
                                });
                            }
                        ).subscribe((rightNeighbour: User) => {
                            neighbours[1] = rightNeighbour;
                            observer.onNext(neighbours);
                        });
                    });
                }
            }
        )
    }

    private updateUserBuildings(token: string, buildings: string): Observable<boolean> {
        return Observable.create<boolean>(
            observer => {
                if (TokenManager.validate(token)) {
                    var username: string = TokenManager.getField(token, "username");
                    Observable.fromPromise<UpdateWriteOpResult>(this.userCollection.updateOne({username: username}, {$set: {buildings: buildings}}, {})).subscribe((result: UpdateWriteOpResult) =>  observer.onNext(true));
                } else observer.onNext(false);
            }
        );
    }

    private readUser(username: string): Observable<User> {
        return Observable.fromPromise<CursorResult>(this.userCollection.find({username: username}).limit(1).next()).map(
            doc =>
                doc == null ? null : new User(doc.username, doc.password, doc.day, doc.registeredNumber, doc.hasAquaSmart, doc.buildings, doc.storms, doc._id)
        );
    }

    private getRandomStorms(): Storm[] {
        var storms: Storm[] = [];
        var amountOfStorms: number = Math.floor(Math.random() * 5) + 1; // 1 to 6 (inclusive) storms a year
        var randomAlreadyTaken: boolean;

        while (storms.length < amountOfStorms) {
            randomAlreadyTaken = false;
            var randomDay: number = Math.floor(Math.random() * 364) + 1;
            for (var i: number = 0; i < storms.length; i++) {
                if (storms[i].day == randomDay) {
                    randomAlreadyTaken = true;
                    break;
                }
            }
            if (randomAlreadyTaken) continue;
            var randomGravity: number = Math.floor(Math.random() * 9) + 1;
            storms.push(new Storm(randomGravity, randomDay));
        }
        return storms;
    }

    private getDataFromRegisteredNumber(registeredNumber: number): Observable<User> {
        return Observable.create<User>(
            observer => {
                Observable.fromPromise<CursorResult>(this.userCollection.find({registeredNumber: registeredNumber}).limit(1).next()).map(
                    doc => {
                        return doc == null ? null : new User(doc.username, "nice try ;)", doc.day, doc.registeredNumber, doc.hasAquaSmart, doc.buildings, doc._id);
                    }
                ).subscribe((user: User) => observer.onNext(user));
            }
        );
    }

    private calculateFatalities(bassin: Bassin): number {
       //todo average weight & feeding ook
        return 4;
    }
}