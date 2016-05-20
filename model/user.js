/// <reference path="../tsdefs/mongodb.d.ts" />
"use strict";
var User = (function () {
    function User(username, password, day, registeredNumber, hasAquaSmart, buildings, storms, _id) {
        this.username = username;
        this.password = password;
        this.day = day;
        this.registeredNumber = registeredNumber;
        this.hasAquaSmart = hasAquaSmart;
        this.buildings = buildings;
        this.storms = storms;
        this._id = _id;
    }
    return User;
}());
exports.User = User;
//# sourceMappingURL=user.js.map