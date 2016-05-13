/// <reference path="../tsdefs/mongodb.d.ts" />
"use strict";
var Building = (function () {
    function Building(location, rotation, type, _id) {
        this.location = location;
        this.rotation = rotation;
        this.type = type;
        this._id = _id;
    }
    return Building;
}());
exports.Building = Building;
//# sourceMappingURL=building.js.map