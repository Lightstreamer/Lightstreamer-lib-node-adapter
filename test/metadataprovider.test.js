/*
Copyright (c) Lightstreamer Srl

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

var currProtocolVersion = "1.9.1";

function overrideMetadataWithParameters(params, credentials) {
    this.stream = new TestStream();
        // we cannot keep the old stream, because it already has a 'data' handler
        // for this.metadataProvider, and, after attaching it to a new MetadataProvider below,
        // the handler would have still been invoked
    this.metadataProvider = new MetadataProvider(this.stream, params, credentials);
}

exports.tests = {
    setUp: function (callback) {
        this.stream = new TestStream();
        this.metadataProvider = new MetadataProvider(this.stream);
        callback();
    },
    "init success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(6);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            test.equal(msg.parameters["P1"], "V1");
            test.equal(msg.parameters["P2"], "V2");
            test.equal(msg.parameters["keepalive_hint.millis"], null);
            test.equal(msg.initResponseParams, null);
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|P1|S|V1|S|ARI.version|S|" + currProtocolVersion + "|S|P2|S|V2|S|keepalive_hint.millis|S|8000\r\n");
    },
    "init success with credentials" : function(test) {
        var credentials = { user: "my_user", password: "my_password" };
        overrideMetadataWithParameters.apply(this, [  null, credentials ]);

        var s = this.stream, mp = this.metadataProvider;
        test.expect(5);
        test.equal(s.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|my_password|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            test.equal(msg.parameters["P1"], "V1");
            test.equal(msg.parameters["P2"], "V2");
            test.equal(msg.initResponseParams, null);
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|P1|S|V1|S|ARI.version|S|" + currProtocolVersion + "|S|P2|S|V2\r\n");
    },
    "init success with keepalives" : function(test) {
        overrideMetadataWithParameters.apply(this, [  null, null, 5000 ]);

        var s = this.stream, mp = this.metadataProvider;
        test.expect(7);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            test.equal(msg.parameters["keepalive_hint.millis"], null);
            test.equal(msg.keepaliveHint, null);
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            setTimeout(function() {
                test.equal(s.popTestData(), "KEEPALIVE\n");
            }, 500);
            setTimeout(function() {
                test.equal(s.popTestData(), null);
            }, 2500);
            setTimeout(function() {
                test.equal(s.popTestData(), "KEEPALIVE\n");
                test.done();
            }, 3500); // the hint of 3000 is used
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "|S|keepalive_hint.millis|S|3000\r\n");
    },
    "Init 1.8.3 unsupported" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            test.fail();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|1.8.3\r\n");
        test.equal(s.popTestData(), "ID0|MPI|EM|Unsupported+protocol+version\n");
        test.done();
    },
    "Init 1.9.0 accepted" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|1.9.0\r\n");
    },
    "credential error with close" : function(test) {
        var credentials = { user: "my_user", password: "wrong_password" };
        overrideMetadataWithParameters.apply(this, [  null, credentials ]);

        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|wrong_password|S|enableClosePacket|S|true\n");
        mp.on('closeMessage', function(reason) {
            // undocumented event
            test.equal(reason, "wrong credentials");
            test.equal(s.popTestData(), null);
        });
        s.on('error', function(exc) {
            test.equal(exc.message.substring(0, 34), "Close requested by the counterpart");
            test.done();
        });
        s.pushTestData("0|CLOSE|S|reason|S|wrong credentials\r\n");
    },
    "init failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|E|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
    },
    "init metadata failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            resp.error("An error", "metadata");
            test.equal(s.popTestData(), "ID0|MPI|EM|An+error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
    },
    "Missing initialization" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(2);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            // not expected
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        mp.on('END', function() {
            // local event
            test.done();
        });
        test.throws(function () {
            s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value 1|S|header2|S|value 2\n");
        }, Error);
        mp.emit("END");
    },
    "Late initialization" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('init', function(msg, resp) {
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        test.throws(function () {
            s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        }, Error);
        test.done();
    },
    "getItemData success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("getItemData", function(msg, resp) {
            test.equal(msg.verb, "getItemData");
            resp.success([
                {distinctSnapLen: 10, minSourceFreq: 0.5, allowedModes: {raw: true, merge: true}},
                {distinctSnapLen: 5, minSourceFreq: 0, allowedModes: {distinct: true}}
            ]);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|GIT|I|10|D|0.5|M|RM|I|5|D|0|M|D\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|GIT|S|An Item Name1|S|An Item Name2\n");
    },
    "getItemData failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("getItemData", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|GIT|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|GIT|S|An Item Name1|S|An Item Name2\n");
    },
    "notifyUser success" : function(test) {
        // also tests the default handler for 'init'
        var credentials = { user: "my_user", password: "my_password" };
        overrideMetadataWithParameters.apply(this, [  null, credentials ]);

        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|my_password|S|enableClosePacket|S|true\n");
        mp.on("notifyUser", function(msg, resp) {
            test.equal(msg.verb, "notifyUser");
            resp.success(12.34, true);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NUS|D|12.34|B|1\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value 1|S|header2|S|value 2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "notifyUser failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyUser", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NUS|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value 1|S|header2|S|value 2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "notifyUser access failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyUser", function(msg, resp) {
            resp.error("An error", "access");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NUS|EA|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value 1|S|header2|S|value 2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "notifyUserAuth success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyUserAuth", function(msg, resp) {
            test.equal(msg.verb, "notifyUserAuth");
            resp.success(12.34, true);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NUA|D|12.34|B|1\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUA|S|user|S|password|S|principal|S|header1|S|value 1|S|header2|S|value 2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "notifyUserAuth failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyUserAuth", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NUA|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUA|S|user|S|password|S|principal|S|header1|S|value 1|S|header2|S|value 2|S|REQUEST_ID|S|FAKEREQID\n");
    },
    "getSchema success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("getSchema", function(msg, resp) {
            test.equal(msg.verb, "getSchema");
            resp.success(["Field 1","Field 2"]);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|GSC|S|Field 1|S|Field 2\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|GSC|S|user|S|group|S|schema|S|FAKESESSID\n");
    },
    "getSchema failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("getSchema", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|GSC|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|GSC|S|user|S|group|S|schema|S|FAKESESSID\n");
    },
    "getItems success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("getItems", function(msg, resp) {
            test.equal(msg.verb, "getItems");
            resp.success(["Item 1","Item 2"]);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|GIS|S|Item 1|S|Item 2\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|GIS|S|user|S|group|S|FAKESESSID\n");
    },
    "getItems failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("getItems", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|GIS|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|GIS|S|user|S|group|S|FAKESESSID\n");
    },
    "getUserItemData success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("getUserItemData", function(msg, resp) {
            test.equal(msg.verb, "getUserItemData");
            resp.success([
                {allowedBufferSize: 30, allowedMaxItemFreq: 3, allowedModes: {raw: true, merge: true, distinct:true, command: true}},
                {allowedBufferSize: 40, allowedMaxItemFreq: 2.25, allowedModes: {merge: true}},
            ]);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|GUI|I|30|D|3|M|RMDC|I|40|D|2.25|M|M\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|GUI|S|user|S|item 1|S|item 2\n");
    },
    "getUserItemData failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("getUserItemData", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|GUI|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|GUI|S|user|S|item 1|S|item 2\n");
    },
    "notifyUserMessage success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyUserMessage", function(msg, resp) {
            test.equal(msg.verb, "notifyUserMessage");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NUM|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUM|S|user|S|FAKESESSID|S|This is a message\n");
    },
    "notifyUserMessage failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyUserMessage", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NUM|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUM|S|user|S|FAKESESSID|S|This is a message\n");
    },
    "notifyNewSession success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyNewSession", function(msg, resp) {
            test.equal(msg.verb, "notifyNewSession");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NNS|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NNS|S|user|S|FAKESESSID|S|prop1|S|val1|S|prop2|S|val2\n");
    },
    "notifyNewSession failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyNewSession", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NNS|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NNS|S|user|S|FAKESESSID|S|prop1|S|val1|S|prop2|S|val2\n");
    },
    "notifySessionClose success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifySessionClose", function(msg, resp) {
            test.equal(msg.verb, "notifySessionClose");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NSC|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NSC|S|FAKESESSID\n");
    },
    "notifySessionClose failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifySessionClose", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NSC|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NSC|S|FAKESESSID\n");
    },
    "notifyNewTables success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyNewTables", function(msg, resp) {
            test.equal(msg.verb, "notifyNewTables");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NNT|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NNT|S|user|S|FAKESESSID|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|5|S|#\n");
    },
    "notifyNewTables failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyNewTables", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NNT|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NNT|S|user|S|FAKESESSID|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|5|S|#\n");
    },
    "notifyTablesClose success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyTablesClose", function(msg, resp) {
            test.equal(msg.verb, "notifyTablesClose");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NTC|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NTC|S|FAKESESSID|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|5|S|#\n");
    },
    "notifyTablesClose failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyTablesClose", function(msg, resp) {
            resp.error("An error");
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NTC|E|An error\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NTC|S|FAKESESSID|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|5|S|#\n");
    },
    "notifyUserMessage with double success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyUserMessage", function(msg, resp) {
            test.equal(msg.verb, "notifyUserMessage");
            resp.success();
            test.throws(function () {
                resp.success();
            }, Error);
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUM|S|user|S|FAKESESSID|S|This is a message\n");
    },
    "notifyUserMessage with double error" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyUserMessage", function(msg, resp) {
            test.equal(msg.verb, "notifyUserMessage");
            resp.error();
            test.throws(function () {
                resp.error();
            }, Error);
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUM|S|user|S|FAKESESSID|S|This is a message\n");
    },
    "notifyMpnDeviceAccess success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyMpnDeviceAccess", function(msg, resp) {
            test.equal(msg.verb, "notifyMpnDeviceAccess");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|MDA|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|MDA|S|user|S|FAKESESSID|P|A|S|appID|S|deviceToken\n");
    },
    "notifyMpnDeviceAccess failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyMpnDeviceAccess", function(msg, resp) {
            var excData = {clientCode: -2, clientMessage: "Message for the client"};
            resp.error("An error", "credits", excData);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|MDA|EC|An error|-2|Message for the client\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|MDA|S|user|S|FAKESESSID|P|A|S|appID|S|deviceToken\n");
    },
    "notifyMpnSubscriptionActivation success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyMpnSubscriptionActivation", function(msg, resp) {
            test.equal(msg.verb, "notifyMpnSubscriptionActivation");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|MSA|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|MSA|S|user|S|FAKESESSID|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|2|P|A|S|appID|S|deviceToken|S|triggerExpression|S|%7B%22aps%22%3A%7B%22alert%22%3A%22%24%7Bmessage%7D%22%2C%22badge%22%3A%22AUTO%22%7D%2C%22acme2%22%3A%5B%22%24%7Btag1%7D%22%2C%22%24%7Btag2%7D%22%5D%7D\n");
    },
    "notifyMpnSubscriptionActivation failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyMpnSubscriptionActivation", function(msg, resp) {
            var excData = {clientCode: -2, clientMessage: "Message for the client"};
            resp.error("An error", "credits", excData);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|MSA|EC|An error|-2|Message for the client\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|MSA|S|user|S|FAKESESSID|I|1|M|M|S|group1|S|data_adapter|S|schema1|I|1|I|2|P|G|S|appID|S|deviceToken|S|triggerExpression|S|%7B%22priority%22%3A%22NORMAL%22%2C%22notification%22%3A%7B%22icon%22%3A%22my_icon%22%2C%22body%22%3A%22my_body%22%2C%22title%22%3A%22my_title%22%7D%7D\n");
    },
    "notifyMpnDeviceTokenChange success" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(4);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyMpnDeviceTokenChange", function(msg, resp) {
            test.equal(msg.verb, "notifyMpnDeviceTokenChange");
            resp.success();
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|MDC|V\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|MDC|S|user|S|FAKESESSID|P|G|S|appID|S|deviceToken|S|deviceToken2\n");
    },
    "notifyMpnDeviceTokenChange failure" : function(test) {
        var s = this.stream, mp = this.metadataProvider;
        test.expect(3);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on("notifyMpnDeviceTokenChange", function(msg, resp) {
            var excData = {clientCode: -2, clientMessage: "Message for the client"};
            resp.error("An error", "credits", excData);
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|MDC|EC|An error|-2|Message for the client\n");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|MDC|S|user|S|FAKESESSID|P|G|S|appID|S|deviceToken|S|deviceToken2\n");
    },
    "some activity with close" : function(test) {
        // also tests the default handlers
        var s = this.stream, mp = this.metadataProvider;
        test.expect(6);
        test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        mp.on('closeMessage', function(reason) {
            // undocumented event
            test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(s.popTestData(), "FAKEID|NUS|D|0|B|0\n");
            test.equal(reason, "keepalive timeout");
            test.equal(s.popTestData(), null);
        });
        s.on('error', function(exc) {
            test.equal(exc.message.substring(0, 34), "Close requested by the counterpart");
            test.done();
        });
        s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        s.pushTestData("FAKEID|NUS|S|user|S|password|S|header1|S|value 1|S|header2|S|value 2|S|REQUEST_ID|S|FAKEREQID\n");
        s.pushTestData("0|CLOSE|S|reason|S|keepalive timeout\r\n");
    },
};
