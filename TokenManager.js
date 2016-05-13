"use strict";
var SHA256 = require("crypto-js/sha256");
var TokenManager = (function () {
    function TokenManager() {
    }
    TokenManager.tokenify = function (user) {
        var encodedHeader = new Buffer(JSON.stringify({ "typ": "JWT", "alg": "HS256" })).toString('base64');
        var encodedClaim = new Buffer(JSON.stringify({ "username": user.username, "registeredNumber": user.registeredNumber })).toString('base64');
        var hashedSignature = this.hash(encodedHeader, encodedClaim);
        return encodedHeader + "." + encodedClaim + "." + hashedSignature;
    };
    TokenManager.validate = function (token) {
        var parts = this.splitToken(token);
        if (parts == null)
            return false;
        var encodedHeader = parts[0];
        var encodedClaim = parts[1];
        var hashedSignature = parts[2];
        return this.hash(encodedHeader, encodedClaim) == hashedSignature;
    };
    TokenManager.hash = function (header, claim) {
        return SHA256(header + "." + claim + this.KEY);
    };
    TokenManager.getField = function (token, fieldName) {
        var parts = this.splitToken(token);
        if (parts == null)
            return false;
        var encodedClaim = parts[1];
        var claimObject = JSON.parse(new Buffer(encodedClaim, 'base64').toString('ascii'));
        return claimObject[fieldName];
    };
    TokenManager.splitToken = function (token) {
        var parts = token.split('.');
        if (parts.length == 3)
            return parts;
        return null;
    };
    TokenManager.KEY = "";
    return TokenManager;
}());
exports.TokenManager = TokenManager;
//# sourceMappingURL=TokenManager.js.map