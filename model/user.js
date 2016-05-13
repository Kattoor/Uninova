/// <reference path="../tsdefs/mongodb.d.ts" />
"use strict";
var User = (function () {
    function User(username, password, registeredNumber, hasAquaSmart, buildings, _id) {
        this.username = username;
        this.password = password;
        this.registeredNumber = registeredNumber;
        this.hasAquaSmart = hasAquaSmart;
        this.buildings = buildings;
        this._id = _id;
    }
    return User;
}());
exports.User = User;
//# sourceMappingURL=user.js.map