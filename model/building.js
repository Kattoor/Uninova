/// <reference path="../tsdefs/mongodb.d.ts" />
"use strict";
var Building = (function () {
    function Building(location, rotation, type, _id, bassins) {
        this.location = location;
        this.rotation = rotation;
        this.type = type;
        this._id = _id;
        this.bassins = bassins;
    }
    return Building;
}());
exports.Building = Building;
//# sourceMappingURL=building.js.map