/// <reference path="../tsdefs/mongodb.d.ts" />

import {ObjectID} from "mongodb";
import {Bassin} from "./bassin";

export class Building {

    constructor(public location: number[], public rotation: number[],
                public type: string, public _id: ObjectID,
                public bassins: Bassin[]) {
        
    }
}