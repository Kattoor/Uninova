import {Building} from "../building";
import {BuildingHistory} from "./buildingHistory";
/**
 * Created by Kattoor on 13/05/2016.
 */

export class DayInfo {
    
    constructor(public day: string, public buildingHistories: BuildingHistory[]) {
        
    }
}