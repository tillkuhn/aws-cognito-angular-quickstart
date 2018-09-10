#!/usr/bin/env node

const fs = require('fs')
var outfile = "ddb-dishes.json";
fs.writeFileSync(outfile,"");
var dishes = require("./mongo-dishes.json");
var uuid = require("../node_modules/uuid/index");
var maxi =  dishes.length;
fs.appendFileSync(outfile, "{\n" + "  \"yummy-dish\":[\n");
for (var i = 0; i < maxi; i++) {
    var d = dishes[i];
    //new Date().toISOString()
    var tags = [];
    if (d.tags) {
        for (var j = 0; j < d.tags.length; j++) {
            tags.push(d.tags[j].text);
        }
    }

    var putti = {
        "PutRequest": {
            "Item": {
                "id": {
                    "S": d._id.$oid
                },
                "createdAt": {
                    "S": "2015-08-09-09T22:22:22.222Z"
                },
                "name": {
                    "S": d.name
                },
                "authenticName": {
                    "S": (d.authenticName) ? d.authenticName : d.name
                },
                "primaryUrl": {
                    "S": d.url
                },
                "imageUrl": {
                    "S": d.imageUrl ? d.imageUrl : "http://clipart.coolclips.com/480/vectors/tf05050/CoolClips_text0361.png"
                },
                "rating": {
                    "N": d.rating.toString()
                },
                "timesServed": {
                    "N": (d.timesServed) ? d.timesServed.toString() : "0"
                },
                "lastServed": {
                    "S": d.lastServedDate ? d.lastServedDate : "2015-09-08T23:22:37.281Z"
                },
                "origin": {
                    "S": d.country ? d.country : "xx"
                },
                "notes": {
                    "S": d.notes ? d.notes: "..."
                },
                "tags": {
                    "SS": tags
                }
            }
        }
    };
    fs.appendFileSync(outfile,"    "+JSON.stringify(putti));
    //console.log(JSON.stringify(putti));
    if (i < maxi-1) fs.appendFileSync(outfile,",\n");
}

fs.appendFileSync(outfile,"\n]\n}\n");
console.log("Finished see " + outfile)