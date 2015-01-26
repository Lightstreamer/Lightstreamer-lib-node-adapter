/*
Copyright 2013 Weswit s.r.l.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var MetadataProvider = require('../lib/lightstreamer-adapter').MetadataProvider,
    TestStream = require('./utils/teststream').TestStream;

exports.tests = {
    setUp: function (callback) {
        this.stream = new TestStream();
        this.metadataProvider = new MetadataProvider(this.stream);
        callback();
    },
    "init success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on('init', function(msg, resp) {
            test.equal(msg.parameters["P1"], "V1");
            test.equal(msg.parameters["P2"], "V2");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|P1|S|V1|S|P2|S|V2\r\n");
    },
    "init failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(1);
        mp.on('init', function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
    },
    "init metadata failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(1);
        mp.on('init', function(msg, resp) {
            resp.error("An error", "metadata");
            test.equal(s.popTestData(), "ID0|MPI|EM|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
    },
    "Missing initialization" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(1);
        mp.on('init', function(msg, resp) {
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
        });
        test.throws(function () {
            s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value+1|S|header+2|S|value+2\n");
        }, Error);
        test.done();
    },
    "Late initialization" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on('init', function(msg, resp) {
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
        });
        s.pushTestData("ID0|MPI\r\n");
        test.throws(function () {
            s.pushTestData("ID0|MPI\r\n");
        }, Error);
        test.done();
    },
    "getItemData success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("getItemData", function(msg, resp) {
            test.equal(msg.verb, "getItemData");
            resp.success([
                {distinctSnapLen: 10, minSourceFreq: 0.5, allowedModes: {raw: true, merge: true}},
                {distinctSnapLen: 5, minSourceFreq: 0, allowedModes: {distinct: true}}
            ]);
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|GIT|I|10|D|0.5|M|RM|I|5|D|0|M|D\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|GIT|S|An+Item+Name1|S|An+Item+Name2\n");
    },
    "getItemData failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("getItemData", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|GIT|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|GIT|S|An+Item+Name1|S|An+Item+Name2\n");
    },
    "notifyUser success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyUser", function(msg, resp) {
            test.equal(msg.verb, "notifyUser");
            resp.success(12.34, true);
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NUS|D|12.34|B|1\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value+1|S|header+2|S|value+2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "notifyUser failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyUser", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NUS|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value+1|S|header+2|S|value+2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "notifyUser access failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyUser", function(msg, resp) {
            resp.error("An error", "access");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NUS|EA|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value+1|S|header+2|S|value+2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "notifyUserAuth success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyUserAuth", function(msg, resp) {
            test.equal(msg.verb, "notifyUserAuth");
            resp.success(12.34, true);
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NUA|D|12.34|B|1\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUA|S|user|S|password|S|principal|S|header1|S|value+1|S|header+2|S|value+2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "notifyUserAuth failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyUserAuth", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NUA|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUA|S|user|S|password|S|principal|S|header1|S|value+1|S|header+2|S|value+2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "getSchema success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("getSchema", function(msg, resp) {
            test.equal(msg.verb, "getSchema");
            resp.success(["Field 1","Field 2"]);
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|GSC|S|Field+1|S|Field+2\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|GSC|S|user|S|group|S|schema|S|FAKESESSID\n");
    },
    "getSchema failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("getSchema", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|GSC|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|GSC|S|user|S|group|S|schema|S|FAKESESSID\n");
    },
    "getItems success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("getItems", function(msg, resp) {
            test.equal(msg.verb, "getItems");
            resp.success(["Item 1","Item 2"]);
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|GIS|S|Item+1|S|Item+2\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|GIS|S|user|S|group|S|FAKESESSID\n");
    },
    "getItems failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("getItems", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|GIS|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|GIS|S|user|S|group|S|FAKESESSID\n");
    },
    "getUserItemData success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("getUserItemData", function(msg, resp) {
            test.equal(msg.verb, "getUserItemData");
            resp.success([
                {allowedBufferSize: 30, allowedMaxItemFreq: 3, allowedModes: {raw: true, merge: true, distinct:true, command: true}},
                {allowedBufferSize: 40, allowedMaxItemFreq: 2.25, allowedModes: {merge: true}},
            ]);
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|GUI|I|30|D|3|M|RMDC|I|40|D|2.25|M|M\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|GUI|S|user|S|item+1|S|item+2\n");
    },
    "getUserItemData failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("getUserItemData", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|GUI|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|GUI|S|user|S|item+1|S|item+2\n");
    },
    "notifyUserMessage success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyUserMessage", function(msg, resp) {
            test.equal(msg.verb, "notifyUserMessage");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NUM|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUM|S|user|S|FAKESESSID|S|This+is+a+message\n");
    },
    "notifyUserMessage failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyUserMessage", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NUM|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUM|S|user|S|FAKESESSID|S|This+is+a+message\n");
    },
    "notifyNewSession success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyNewSession", function(msg, resp) {
            test.equal(msg.verb, "notifyNewSession");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NNS|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NNS|S|user|S|FAKESESSID|S|prop1|S|val1|S|prop2|S|val2\n");
    },
    "notifyNewSession failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyNewSession", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NNS|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NNS|S|user|S|FAKESESSID|S|prop1|S|val1|S|prop2|S|val2\n");
    },
    "notifySessionClose success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifySessionClose", function(msg, resp) {
            test.equal(msg.verb, "notifySessionClose");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NSC|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NSC|S|FAKESESSID\n");
    },
    "notifySessionClose failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifySessionClose", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NSC|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NSC|S|FAKESESSID\n");
    },
    "notifyNewTables success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyNewTables", function(msg, resp) {
            test.equal(msg.verb, "notifyNewTables");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NNT|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NNT|S|user|S|FAKESESSID|I|1|M|M|S|group1|S|schema1|I|1|I|5|S|#\n");
    },
    "notifyNewTables failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyNewTables", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NNT|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NNT|S|user|S|FAKESESSID|I|1|M|M|S|group1|S|schema1|I|1|I|5|S|#\n");
    },
    "notifyTablesClose success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyTablesClose", function(msg, resp) {
            test.equal(msg.verb, "notifyTablesClose");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NTC|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NTC|S|FAKESESSID|I|1|M|M|S|group1|S|schema1|I|1|I|5|S|#\n");
    },
    "notifyTablesClose failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyTablesClose", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|NTC|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NTC|S|FAKESESSID|I|1|M|M|S|group1|S|schema1|I|1|I|5|S|#\n");
    },
    "notifyUserMessage with double success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyUserMessage", function(msg, resp) {
            test.equal(msg.verb, "notifyUserMessage");
            resp.success();
            test.throws(function () {
                resp.success();
            }, Error);
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUM|S|user|S|FAKESESSID|S|This+is+a+message\n");
    },
    "notifyUserMessage with double error" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyUserMessage", function(msg, resp) {
            test.equal(msg.verb, "notifyUserMessage");
            resp.error();
            test.throws(function () {
                resp.error();
            }, Error);
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|NUM|S|user|S|FAKESESSID|S|This+is+a+message\n");
    },
    "notifyMpnDeviceAccess success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyMpnDeviceAccess", function(msg, resp) {
            test.equal(msg.verb, "notifyMpnDeviceAccess");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|MDA|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|MDA|S|user|P|A|S|appID|S|deviceToken\n");
    },
    "notifyMpnDeviceAccess failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyMpnDeviceAccess", function(msg, resp) {
            resp.error("An error", "credits");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|MDA|EC|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|MDA|S|user|P|A|S|appID|S|deviceToken\n");
    },
    "notifyMpnSubscriptionActivation success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyMpnSubscriptionActivation", function(msg, resp) {
            test.equal(msg.verb, "notifyMpnSubscriptionActivation");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|MSA|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|MSA|S|user|S|FAKESESSID|I|1|M|M|S|group1|S|schema1|I|1|I|2|PA|2|2|P|A|S|appID|S|deviceToken|S|triggerExpression|S|sound|S|badge|S|locActionKey|S|launghImage|S|format|S|locFormatKey|S|arg1|S|arg2|S|customKey1|S|customValue1|S|customKey2|S|customValue2\n");
    },
    "notifyMpnSubscriptionActivation failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyMpnSubscriptionActivation", function(msg, resp) {
            resp.error("An error", "credits");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|MSA|EC|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|MSA|S|user|S|FAKESESSID|I|1|M|M|S|group1|S|schema1|I|1|I|2|PA|2|2|P|A|S|appID|S|deviceToken|S|triggerExpression|S|sound|S|badge|S|locActionKey|S|launghImage|S|format|S|locFormatKey|S|arg1|S|arg2|S|customKey1|S|customValue1|S|customKey2|S|customValue2\n");
    },
    "notifyMpnDeviceTokenChange success" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        mp.on("notifyMpnDeviceTokenChange", function(msg, resp) {
            test.equal(msg.verb, "notifyMpnDeviceTokenChange");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|MDC|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|MDC|S|user|P|G|S|appID|S|deviceToken|S|deviceToken2\n");
    },
    "notifyMpnDeviceTokenChange failure" : function(test) {
        var d, s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        mp.on("notifyMpnDeviceTokenChange", function(msg, resp) {
            resp.error("An error", "credits");
            test.equal(s.popTestData(), "ID0|MPI|V\n");
            test.equal(s.popTestData(), "FAKEID|MDC|EC|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI\r\n");
        s.pushTestData("FAKEID|MDC|S|user|P|G|S|appID|S|deviceToken|S|deviceToken2\n");
    },
};
