import {User} from "./model/user";

var SHA256 = require("crypto-js/sha256");

export class TokenManager {

    private static KEY: string = "";

    public static tokenify(user: User) {
        var encodedHeader: string = new Buffer(JSON.stringify({"typ": "JWT", "alg": "HS256"})).toString('base64');
        var encodedClaim: string = new Buffer(JSON.stringify({"username": user.username, "registeredNumber": user.registeredNumber})).toString('base64');
        var hashedSignature: string = this.hash(encodedHeader, encodedClaim);
        return encodedHeader + "." + encodedClaim + "." + hashedSignature;
    }

    public static validate(token): boolean {
        var parts: string[] = this.splitToken(token);
        if (parts == null)
            return false;
        var encodedHeader = parts[0];
        var encodedClaim = parts[1];
        var hashedSignature = parts[2];
        return this.hash(encodedHeader, encodedClaim) == hashedSignature;
    }

    private static hash(header: string, claim: string): string {
        return SHA256(header + "." + claim + this.KEY);
    }

    public static getField(token, fieldName: string) {
        var parts: string[] = this.splitToken(token);
        if (parts == null)
            return false;
        var encodedClaim = parts[1];
        var claimObject = JSON.parse(new Buffer(encodedClaim, 'base64').toString('ascii'));
        return claimObject[fieldName];
    }

    private static splitToken(token): string[] {
        var parts: string[] = token.split('.');
        if (parts.length == 3)
            return parts;
        return null;
    }
}