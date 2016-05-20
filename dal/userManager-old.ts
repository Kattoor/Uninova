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
import {Building} from "../model/building";
import {UpdateWriteOpResult} from "mongodb";
import {DayInfo} from "../model/history/dayInfo";

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

    public createUser(user: User): Observable<boolean> {
        return Observable.create<boolean>(
            observer => {
                (this.readUser(user.username) as Observable<User>).subscribe(
                    readUser => {
                        if (readUser == null) {
                            Observable.fromPromise<number>(this.userCollection.count({})).subscribe(count => {
                                user.registeredNumber = count;
                                Observable.fromPromise<InsertOneWriteOpResult>(this.userCollection.insertOne(user)).subscribe(() => observer.onNext(true));
                            });
                        } else
                            observer.onNext(false);
                    }
                );
            }
        );
    }

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

    public readUser(username: string): Observable<User> {
        return Observable.fromPromise<CursorResult>(this.userCollection.find({username: username}).limit(1).next()).map(
            doc =>
                doc == null ? null : new User(doc.username, doc.password, doc.day, doc.registeredNumber, doc.hasAquaSmart, doc.buildings, doc._id)
        );
    }

    public readUsers(): Observable<User[]> {
        var users: User[] = [];
        return Observable.create<User[]>((observer) =>
            this.userCollection.find({}).forEach(
                document =>
                    users.push(document),
                () =>
                    observer.onNext(users)
            )
        );
    }

    public deleteUser(username: string) {
        this.userCollection.deleteMany({username: username});
    }

    public login(user: User): Observable<string> {
        return Observable.create<string>(
            observer =>
                (this.readUser(user.username) as Observable<User>).subscribe(
                    (readUser) =>
                        observer.onNext(readUser != null && user.password.localeCompare(readUser.password) == 0 ? TokenManager.tokenify(readUser) : null)
                )
        );
    }

    /*public addBuilding(token: string, building: Building): Observable<boolean> {
        //var name: string = TokenManager.getField(token, "name");
        if (TokenManager.validate(token)) {

        }
        

    }*/

    public getDummyData(type: string): Observable<string> {
        var userCollection: Collection = this.db.collection("dummydata");
        return Observable.fromPromise<CursorResult>(userCollection.find({type: type}).limit(1).next()).map(
            doc =>
                doc == null ? null : doc.content
        );
    }

    public getDataFromRegisteredNumber(token: string, registeredNumber: number): Observable<User> {
        return Observable.create<User>(
            observer => {
                if (TokenManager.validate(token)) {
                    Observable.fromPromise<CursorResult>(this.userCollection.find({registeredNumber: registeredNumber}).limit(1).next()).map(
                        doc => {
                            return doc == null ? null : new User(doc.username, "nice try ;)", doc.day, doc.registeredNumber, doc.hasAquaSmart, doc.buildings, doc._id);
                        }
                    ).subscribe((user: User) => observer.onNext(user));
                }
            }
        );
    }
    

    public getData(token: string, from: string): Observable<any> {
        return Observable.create<any>(
            observer => {
                if (TokenManager.validate(token)) {
                    var requestingUsername:string = TokenManager.getField(token, "username");
                    (this.readUser(requestingUsername) as Observable<User>).subscribe((requestingUser:User) => {
                        if (from.localeCompare(requestingUsername) == 0 || requestingUser.hasAquaSmart)
                            (this.readUser(from) as Observable<User>).subscribe((requestedUser:User) => observer.onNext(requestedUser));
                        else
                            observer.onNext("User hasn't got AquaSmart system");
                    });
                }
            }
        );
    }

    public getNeighbours(token: string): Observable<any> {
        return Observable.create<any>(
            observer => {
                if (TokenManager.validate(token)) {
                    var registeredNumber: string = TokenManager.getField(token, "registeredNumber");
                    var neighbours: User[] = [];

                    Observable.create<User>(
                        observerNeighbour1 => {
                            if ((+registeredNumber) > 0)
                                this.getDataFromRegisteredNumber(token, (+registeredNumber) - 1).subscribe(user => observerNeighbour1.onNext(user));
                            else
                                observerNeighbour1.onNext(null);
                        }
                    ).subscribe((user: User) => {
                        neighbours[0] = user;
                        Observable.fromPromise<number>(this.userCollection.count({})).subscribe(count => {
                            if ((+registeredNumber) < (count - 1)) {
                                this.getDataFromRegisteredNumber(token, (+registeredNumber) + 1).subscribe(user => {
                                    neighbours[1] = user;
                                    observer.onNext(neighbours);
                                });
                            } else {
                                neighbours[1] = null;
                                observer.onNext(neighbours);
                            }
                        });
                    })
                }
            }
        );
    }

    public dayPassed(token: string, dayInfo: DayInfo): Observable<any> {
        return Observable.create<any>(
            observer => {
                if (TokenManager.validate(token)) {
                    var username: string = TokenManager.getField(token, "username");
                    Observable.fromPromise<UpdateWriteOpResult>(this.userCollection.updateOne({username: username}, {$set: {day: dayInfo.day}}, {})).subscribe((result: UpdateWriteOpResult) => {
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
                    });
                }
            }
        );
    }

    public getHistory(token: string): Observable<any> {
        return Observable.create<any>(
            observer => {
                if (TokenManager.validate(token)) {
                    var username: string = TokenManager.getField(token, "username");
                    console.log(username);
                    Observable.fromPromise<CursorResult>(this.historyCollection.find({username: username}).limit(1).next()).map(
                        doc =>
                            doc == null ? null : {days: doc.days}
                    ).subscribe(doc => observer.onNext(doc));
                }
            }
        );
    }
}