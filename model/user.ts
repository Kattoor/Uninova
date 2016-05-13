/// <reference path="../tsdefs/mongodb.d.ts" />

import {ObjectID} from "mongodb";
import {Building} from "./building";

export class User {

    constructor(public username: string, public password: string, public registeredNumber?: number, public hasAquaSmart?: boolean, public buildings?: Building[], public _id?: ObjectID) {
    }
}