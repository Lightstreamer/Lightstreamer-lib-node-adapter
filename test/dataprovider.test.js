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

var DataProvider = require('../lib/lightstreamer-adapter').DataProvider,
    TestStream = require('./utils/teststream').TestStream;

var currProtocolVersion = "1.9.0";

function overrideDataWithParameters(isSnapshotAvailable, credentials, doubleConn) {
    this.reqRespStream = new TestStream();
        // we cannot keep an old stream, because it already has a 'data' handler
        // for this.dataProvider, and, after attaching it to a new DataProvider below,
        // the handler would have still been invoked
    if (doubleConn) {
        this.notifyStream = new TestStream();
    } else {
        this.notifyStream = null;
    }
    this.dataProvider = new DataProvider(this.reqRespStream, this.notifyStream, isSnapshotAvailable, credentials);
}

exports.tests = {
    setUp: function (callback) {
        this.reqRespStream = new TestStream();
        this.notifyStream = null;
        this.dataProvider = new DataProvider(this.reqRespStream, this.notifyStream);
        callback();
    },
    "Initialization" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(6);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            test.equal(message.parameters["P1"], "V1");
            test.equal(message.parameters["P2"], "V2");
            test.equal(message.parameters["keepalive_hint.millis"], null);
            test.equal(message.initResponseParams, null);
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|P1|S|V1|S|ARI.version|S|" + currProtocolVersion + "|S|P2|S|V2|S|keepalive_hint.millis|S|8000\r\n");
    },
    "Initialization with credentials on double conn" : function(test) {
        var credentials = { user: "my_user", password: "my_password" };
        overrideDataWithParameters.apply(this, [ null, credentials, true ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(6);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|my_password|S|enableClosePacket|S|true\n");
        test.equal(notifyStream.popTestData().substring(13), "|RAC|S|user|S|my_user|S|password|S|my_password|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            test.equal(message.parameters["P1"], "V1");
            test.equal(message.parameters["P2"], "V2");
            test.equal(message.initResponseParams, null);
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|P1|S|V1|S|ARI.version|S|" + currProtocolVersion + "|S|P2|S|V2\r\n");
    },
    "Initialization with credentials" : function(test) {
        var credentials = { user: "my_user", password: "my_password" };
        overrideDataWithParameters.apply(this, [ null, credentials, false ]);

        var stream = this.reqRespStream;
        test.expect(5);
        test.equal(stream.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|my_password|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            test.equal(message.parameters["P1"], "V1");
            test.equal(message.parameters["P2"], "V2");
            test.equal(message.initResponseParams, null);
            response.success();
            test.equal(stream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|P1|S|V1|S|ARI.version|S|" + currProtocolVersion + "|S|P2|S|V2\r\n");
    },
    "Initialization with keepalives on double conn" : function(test) {
        overrideDataWithParameters.apply(this, [ null, null, true ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(11);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        test.equal(notifyStream.popTestData().substring(13), "|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            test.equal(message.parameters["keepalive_hint.millis"], null);
            test.equal(message.keepaliveHint, null);
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            setTimeout(function() {
                test.equal(reqRespStream.popTestData(), "KEEPALIVE\n");
                test.equal(notifyStream.popTestData(), "KEEPALIVE\n");
            }, 500);
            setTimeout(function() {
                test.equal(reqRespStream.popTestData(), null);
                test.equal(notifyStream.popTestData(), null);
            }, 2500);
            setTimeout(function() {
                test.equal(reqRespStream.popTestData(), "KEEPALIVE\n");
                test.equal(notifyStream.popTestData(), "KEEPALIVE\n");
                test.done();
            }, 3500); // the hint of 3000 is used
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "|S|keepalive_hint.millis|S|3000\r\n");
    },
    "Initialization with keepalives" : function(test) {
        var stream = this.reqRespStream;
        test.expect(7);
        test.equal(stream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            test.equal(message.parameters["keepalive_hint.millis"], null);
            test.equal(message.keepaliveHint, null);
            response.success();
            test.equal(stream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            setTimeout(function() {
                test.equal(stream.popTestData(), "KEEPALIVE\n");
            }, 500);
            setTimeout(function() {
                test.equal(stream.popTestData(), null);
            }, 2500);
            setTimeout(function() {
                test.equal(stream.popTestData(), "KEEPALIVE\n");
                test.done();
            }, 3500); // the hint of 3000 is used
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "|S|keepalive_hint.millis|S|3000\r\n");
    },
    "Initialization 1.8.0 unsupported on double conn" : function(test) {
        overrideDataWithParameters.apply(this, [ null, null, true ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(4);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        test.equal(notifyStream.popTestData().substring(13), "|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            test.fail();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|P1|S|V1|S|P2|S|V2\r\n");
        test.equal(reqRespStream.popTestData(), "ID0|DPI|ED|Unsupported+protocol+version\n");
        test.equal(notifyStream.popTestData(), null);
        test.done();
    },
    "Initialization 1.8.3 to be upgraded on double conn" : function(test) {
        overrideDataWithParameters.apply(this, [ null, null, true ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(4);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        test.equal(notifyStream.popTestData().substring(13), "|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(notifyStream.popTestData(), null);
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|1.8.3\r\n");
    },
    "Credential error with close on double conn" : function(test) {
        var credentials = { user: "my_user", password: "wrong_password" };
        overrideDataWithParameters.apply(this, [ null, credentials, true ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(6);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|wrong_password|S|enableClosePacket|S|true\n");
        test.equal(notifyStream.popTestData().substring(13), "|RAC|S|user|S|my_user|S|password|S|wrong_password|S|enableClosePacket|S|true\n");
        this.dataProvider.on('closeMessage', function(reason) {
            // undocumented event
            test.equal(reason, "wrong credentials");
            test.equal(reqRespStream.popTestData(), null);
            test.equal(notifyStream.popTestData(), null);
        });
        reqRespStream.on('error', function(exc) {
            test.equal(exc.message.substring(0, 34), "Close requested by the counterpart");
            test.done();
        });
        this.reqRespStream.pushTestData("0|CLOSE|S|reason|S|wrong credentials\r\n");
    },
    "Credential error with close" : function(test) {
        var credentials = { user: "my_user", password: "wrong_password" };
        overrideDataWithParameters.apply(this, [ null, credentials, false ]);

        var reqRespStream = this.reqRespStream;
        test.expect(4);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|wrong_password|S|enableClosePacket|S|true\n");
        this.dataProvider.on('closeMessage', function(reason) {
            // undocumented event
            test.equal(reason, "wrong credentials");
            test.equal(reqRespStream.popTestData(), null);
        });
        reqRespStream.on('error', function(exc) {
            test.equal(exc.message.substring(0, 34), "Close requested by the counterpart");
            test.done();
        });
        this.reqRespStream.pushTestData("0|CLOSE|S|reason|S|wrong credentials\r\n");
    },
    "Failed initialization" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(2);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            response.error("An exception", "data");
            test.equal(reqRespStream.popTestData(), "ID0|DPI|ED|An+exception\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
    },
    "Missing initialization" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(2);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            // not expected
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        this.dataProvider.on('END', function() {
            // local event
            test.done();
        });
        test.throws(function () {
            this.reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
        }, Error);
        this.dataProvider.emit("END");
    },
    "Late initialization" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(3);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('init', function(message, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        test.throws(function () {
            this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        }, Error);
        test.done();
    },
    "Subscribe with snapshot" : function(test) {
        var isSnapshotAvailable = function(itemName) {
            test.equal(itemName, "An Item Name");
            return true;
        };
        overrideDataWithParameters.apply(this, [ isSnapshotAvailable, null, false ]);

        var reqRespStream = this.reqRespStream;
        test.expect(6);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('subscribe', function(itemName, response) {
            test.equal(itemName, "An Item Name");
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            test.equal(reqRespStream.popTestData(), null);
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
    },
    "Subscribe without snapshot" : function(test) {
        var credentials = { user: "my_user", password: "my_password" };
        overrideDataWithParameters.apply(this, [ null, credentials, false ]);

        var reqRespStream = this.reqRespStream;
        test.expect(4);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|my_password|S|enableClosePacket|S|true\n");
        this.dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            test.equal(reqRespStream.popTestData().substring(13), "|EOS|S|An Item Name|S|FAKEID\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
    },
    "Failed subscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(3);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('subscribe', function(itemName, response) {
            response.error("An exception", "subscription");
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|EU|An exception\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
    },
    "Unsubscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(4);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('unsubscribe', function(itemName, response) {
            test.equal(itemName, "An Item Name");
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|USB|V\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|USB|S|An Item Name\r\n");
    },
    "Late subscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        var dataProvider = this.dataProvider;
        var subNum = 0, unsubNum = 0, subNumQ = 0, unsubNumQ = 0;
        var sub1DelayedResponse;
        test.expect(20);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        dataProvider.on('init', function(message, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        dataProvider.on('subscribe', function(itemName, response) {
            subNum++;
            test.ok(true, subNum + ") subscribe has been called");
            if (subNum === 1) {
                // Sub ID1
                // we keep the response without forwarding it, hence simulating a delay;
                // this will cause the next requests to queue up internally;
                // we will forward this response only upon the reception of the third unsubscription;
                // we will be notified of requests being enqueued internally thanks to the undocumented
                // subscribeInQueue/unsubscribeInQueue events
                sub1DelayedResponse = response;
            } else if (subNum === 2) {
                // Sub ID7 at last
                response.success();
                test.equals(reqRespStream.popTestData(), "ID7|SUB|V\n");
                test.equals(reqRespStream.popTestData().substring(13), "|EOS|S|item1|S|ID7\n");
                test.done();
            }
        });
        dataProvider.on('unsubscribeInQueue', function(itemName) {
            unsubNumQ++;
            test.ok(true, unsubNumQ + ") unsubscribe in queue");
            if (unsubNumQ === 3) {
                // On unsub ID6 ***
                sub1DelayedResponse.success();
            }
        });
        dataProvider.on('unsubscribe', function(itemName, response) {
            unsubNum++;
            test.ok(true, unsubNum + ") unsubscribe has been called");
            if (unsubNum === 1) {
                // Called after ***
                response.success();
                test.equals(reqRespStream.popTestData(), "ID1|SUB|V\n");
                test.equals(reqRespStream.popTestData().substring(13), "|EOS|S|item1|S|ID1\n");
                test.equals(reqRespStream.popTestData(), "ID2|USB|V\n");
                test.equals(reqRespStream.popTestData(), "ID3|SUB|EU|Subscribe request come too late\n");
                test.equals(reqRespStream.popTestData(), "ID4|USB|V\n");
                test.equals(reqRespStream.popTestData(), "ID5|SUB|EU|Subscribe request come too late\n");
                test.equals(reqRespStream.popTestData(), "ID6|USB|V\n");
                test.ok(typeof reqRespStream.popTestData() === "undefined");
            }
        });
        dataProvider.on('subscribeInQueue', function(itemName) {
            subNumQ++;
            test.ok(true, subNumQ + ") subscribe in queue");
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("ID1|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID2|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID3|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID4|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID5|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID6|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID7|SUB|S|item1\n");
    },
    "Late subscribe first reply on unsubscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        var dataProvider = this.dataProvider;
        var subNum = 0, unsubNum = 0, subNumQ = 0, unsubNumQ = 0;
        var subDelayedResp;
        test.expect(21);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        dataProvider.on('init', function(message, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        dataProvider.on('subscribe', function(itemName, response) {
            subNum++;
            test.ok(true, subNum + ") subscribe has been called");
            if (subNum === 1) {
                response.success();
                test.equals(reqRespStream.popTestData(), "ID1|SUB|V\n");
                test.equals(reqRespStream.popTestData().substring(13), "|EOS|S|item1|S|ID1\n");
            } else if (subNum === 2) {
                // Delay on 2nd sub
                subDelayedResp = response;
            } else if (subNum === 3) {
                // Sub ID7 at last
                response.success();
                test.equals(reqRespStream.popTestData(), "ID7|SUB|V\n");
                test.equals(reqRespStream.popTestData().substring(13), "|EOS|S|item1|S|ID7\n");
                test.done();
            }

        });
        dataProvider.on('unsubscribeInQueue', function(itemName) {
            unsubNumQ++;
            test.ok(true, unsubNumQ + ") unsubscribe in queue");
            if (unsubNumQ === 2) {
                // On unsub ID6 ***
                subDelayedResp.success();
            }
        });
        dataProvider.on('unsubscribe', function(itemName, response) {
            unsubNum++;
            test.ok(true, unsubNum + ") unsubscribe has been called");
            if (unsubNum === 1) {
                response.success();
                test.equals(reqRespStream.popTestData(), "ID2|USB|V\n");
            } else if (unsubNum === 2) {
                response.success();
                test.equals(reqRespStream.popTestData(), "ID3|SUB|V\n");
                test.equals(reqRespStream.popTestData().substring(13), "|EOS|S|item1|S|ID3\n");
                test.equals(reqRespStream.popTestData(), "ID4|USB|V\n");
                test.equals(reqRespStream.popTestData(), "ID5|SUB|EU|Subscribe request come too late\n");
                test.equals(reqRespStream.popTestData(), "ID6|USB|V\n");
                test.ok(typeof reqRespStream.popTestData() === "undefined");
            }
        });
        dataProvider.on('subscribeInQueue', function(itemName) {
            subNumQ++;
            test.ok(true, subNumQ + ") subscribe in queue");
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("ID1|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID2|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID3|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID4|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID5|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID6|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID7|SUB|S|item1\n");
    },
    "Failure" : function(test) {
        var dataProvider = this.dataProvider;
        var reqRespStream = this.reqRespStream;
        test.expect(3);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        dataProvider.on('init', function(message, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            dataProvider.failure("An exception");
            // note: failure cannot be issued before the channel is fully initialized
            test.equal(reqRespStream.popTestData().substring(13), "|FAL|E|An exception\n");
            test.done();
        });
        reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
    },
    "End of snapshot" : function(test) {
        var dataProvider = this.dataProvider;
        var reqRespStream = this.reqRespStream;
        test.expect(4);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            dataProvider.endOfSnapshot("An Item Name");
            test.equal(reqRespStream.popTestData().substring(13), "|EOS|S|An Item Name|S|FAKEID\n");
            test.done();
        });
        reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
    },
    "End of snapshot with an unsubscribed item" : function(test) {
        test.expect(1);
        test.throws(function () {
            this.dataProvider.endOfSnapshot("I'm not subscribed yet");
        }, Error);
        test.done();
    },
    "Update by hash" : function(test) {
        var fake = "";
        var dataProvider = this.dataProvider;
        var reqRespStream = this.reqRespStream;
        test.expect(5);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");

        dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            dataProvider.update("AnItemName", true,
                {
                    "field1" : "A string",
                    "field2" : "",
                    "field3" : null,
                    "field4" : 12.4,
                    "field5" : true,
                    "field6" : 0,
                    "field7" : NaN,
                    "field8" : fake.undef, //fake does not have an undef property
                    "field9" : false
                });
            test.equal(reqRespStream.popTestData().substring(13), "|EOS|S|AnItemName|S|FAKEID\n");
            test.equal(reqRespStream.popTestData().substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
                "S|field1|S|A string|S|field2|S|$|S|field3|S|#|" +
                "S|field4|S|12.4|S|field5|S|true|S|field6|S|0|" +
                "S|field7|S|NaN|S|field8|S|undefined|S|field9|S|false\n");
            test.done();
        });

        reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        reqRespStream.pushTestData("FAKEID|SUB|S|AnItemName\r\n");
    },
    "Update by hash on double conn" : function(test) {
        overrideDataWithParameters.apply(this, [ null, null, true ]);

        var fake = "";
        var dataProvider = this.dataProvider;
        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(3);
        test.equal(notifyStream.popTestData().substring(13), "|RAC|S|enableClosePacket|S|true\n");

        dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            dataProvider.update("AnItemName", true,
                {
                    "field1" : "A string",
                    "field2" : "",
                    "field3" : null,
                    "field4" : 12.4,
                    "field5" : true,
                    "field6" : 0,
                    "field7" : NaN,
                    "field8" : fake.undef, //fake does not have an undef property
                    "field9" : false
                });
            test.equal(notifyStream.popTestData().substring(13), "|EOS|S|AnItemName|S|FAKEID\n");
            test.equal(notifyStream.popTestData().substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
                "S|field1|S|A string|S|field2|S|$|S|field3|S|#|" +
                "S|field4|S|12.4|S|field5|S|true|S|field6|S|0|" +
                "S|field7|S|NaN|S|field8|S|undefined|S|field9|S|false\n");
            test.done();
        });

        reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        reqRespStream.pushTestData("FAKEID|SUB|S|AnItemName\r\n");
    },
    "Update by hash with an unsubscribed item" : function(test) {
        test.expect(1);
        test.throws(function () {
            this.dataProvider.update("AnItemName", true, {"field1" : "A string"});
        }, Error);
        test.done();
    },       
    "Update by hash, then clear snapshot" : function(test) {
        var fake = "";
        var dataProvider = this.dataProvider;
        var reqRespStream = this.reqRespStream;
        test.expect(6);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");

        dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            dataProvider.update("AnItemName", true,
                {
                    "field1" : "A string",
                    "field2" : "",
                    "field3" : null,
                    "field4" : 12.4,
                    "field5" : true,
                    "field6" : 0,
                    "field7" : NaN,
                    "field8" : fake.undef, //fake does not have an undef property
                    "field9" : false
                });
            dataProvider.clearSnapshot("AnItemName");
            test.equal(reqRespStream.popTestData().substring(13), "|EOS|S|AnItemName|S|FAKEID\n");
            test.equal(reqRespStream.popTestData().substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
                "S|field1|S|A string|S|field2|S|$|S|field3|S|#|" +
                "S|field4|S|12.4|S|field5|S|true|S|field6|S|0|" +
                "S|field7|S|NaN|S|field8|S|undefined|S|field9|S|false\n");
            test.equal(reqRespStream.popTestData().substring(13), "|CLS|S|AnItemName|S|FAKEID\n");
            test.done();
        });

        reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        reqRespStream.pushTestData("FAKEID|SUB|S|AnItemName\r\n");
    },
    "Update a field which supports JSON Patch and diff-match-patch" : function(test) {
        var fake = "";
        var dataProvider = this.dataProvider;
        var reqRespStream = this.reqRespStream;
        test.expect(6);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");

        dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            dataProvider.declareFieldDiffOrder("AnItemName",
                {
                    "field1" : [ "JSONPATCH", "DIFF_MATCH_PATCH" ]
                });
            dataProvider.update("AnItemName", true,
                {
                    "field1" : "{ val: 1 }"
                });
            test.equal(reqRespStream.popTestData().substring(13), "|EOS|S|AnItemName|S|FAKEID\n");
                // EOS is sent immediately upon subscribe() if isSnapshotAvailable is false
            test.equal(reqRespStream.popTestData().substring(13), "|DFD|S|AnItemName|S|FAKEID|" +
                "S|field1|F|JM\n");
            test.equal(reqRespStream.popTestData().substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
                "S|field1|S|{ val: 1 }\n");
            test.done();
        });

        reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        reqRespStream.pushTestData("FAKEID|SUB|S|AnItemName\r\n");
    },
    "Subscribe with double success" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(2);
        this.dataProvider.on('subscribe', function(itemName, response) {
            test.equal(itemName, "An Item Name");
            response.success();
            test.throws(function () {
                response.success();
            }, Error);
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
    },
    "Subscribe with double error" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(2);
        this.dataProvider.on('subscribe', function(itemName, response) {
            test.equal(itemName, "An Item Name");
            response.success();
            test.throws(function () {
                response.error();
            }, Error);
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
    },
    "some activity with close" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(7);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true\n");
        this.dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            test.equal(reqRespStream.popTestData().substring(13), "|EOS|S|An Item Name|S|FAKEID\n");
        });
        this.dataProvider.on('closeMessage', function(reason) {
            // undocumented event
            test.equal(reason, "keepalive timeout");
            test.equal(reqRespStream.popTestData(), null);
        });
        reqRespStream.on('error', function(exc) {
            test.equal(exc.message.substring(0, 34), "Close requested by the counterpart");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
        this.reqRespStream.pushTestData("0|CLOSE|S|reason|S|keepalive timeout\r\n");
    },
};