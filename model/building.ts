/// <reference path="../tsdefs/mongodb.d.ts" />

import {ObjectID} from "mongodb";

export class Building {

    constructor(public location: number[], public rotation: number[], public type: string, public _id: ObjectID) {
        
    }
}