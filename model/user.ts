/// <reference path="../tsdefs/mongodb.d.ts" />

import {ObjectID} from "mongodb";
import {Building} from "./building";
import {Storm} from "./storm";

export class User {

    constructor(public username: string, public password: string,
                public day?: string, public registeredNumber?: number,
                public hasAquaSmart?: boolean, public buildings?: Building[], public storms?: Storm[],
                public _id?: ObjectID) {

    }
}