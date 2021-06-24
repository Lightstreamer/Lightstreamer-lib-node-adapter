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

var currProtocolVersion = "1.8.2";

function overrideDataWithParameters(isSnapshotAvailable, credentials) {
    this.reqRespStream = new TestStream();
        // we cannot keep the old reqRespStream, because it already has a 'data' handler
        // for this.dataProvider, and, after attaching it to a new DataProvider below,
        // the handler would have still been invoked
    this.dataProvider = new DataProvider(this.reqRespStream, this.notifyStream, isSnapshotAvailable, credentials);
}

exports.tests = {
    setUp: function (callback) {
        this.reqRespStream = new TestStream();
        this.notifyStream = new TestStream();
        this.dataProvider = new DataProvider(this.reqRespStream, this.notifyStream);
        callback();
    },
    "Initialization" : function(test) {
        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(5);
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
    "Initialization with credentials" : function(test) {
        var credentials = { user: "my_user", password: "my_password" };
        overrideDataWithParameters.apply(this, [  null, credentials ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(6);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|my_password\n");
        test.equal(notifyStream.popTestData().substring(13), "|RAC|S|user|S|my_user|S|password|S|my_password\n");
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
    "Initialization with keepalives" : function(test) {
        overrideDataWithParameters.apply(this, [  null, null, 5000 ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(9);
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
    "Initialization OLD" : function(test) {
        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(4);
        this.dataProvider.on('init', function(message, response) {
            test.equal(message.parameters["P1"], "V1");
            test.equal(message.parameters["P2"], "V2");
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|V\n");
            test.equal(notifyStream.popTestData(), null);
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|P1|S|V1|S|P2|S|V2\r\n");
    },
    "Initialization OLD with keepalives" : function(test) {
        overrideDataWithParameters.apply(this, [  null, null, 5000 ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(8);
        this.dataProvider.on('init', function(message, response) {
            test.equal(message.parameters["keepalive_hint.millis"], "3000");
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|V\n");
            setTimeout(function() {
                test.equal(reqRespStream.popTestData(), "KEEPALIVE\n");
                test.equal(notifyStream.popTestData(), "KEEPALIVE\n");
                test.equal(reqRespStream.popTestData(), null);
                test.equal(notifyStream.popTestData(), null);
            }, 500);
            setTimeout(function() {
                test.equal(reqRespStream.popTestData(), "KEEPALIVE\n");
                test.equal(notifyStream.popTestData(), "KEEPALIVE\n");
                test.done();
            }, 1500); // with no hint, use 1 second
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|keepalive_hint.millis|S|3000\r\n");
    },
    "Failed initialization" : function(test) {
        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(2);
        this.dataProvider.on('init', function(message, response) {
            response.error("An exception", "data");
            test.equal(reqRespStream.popTestData(), "ID0|DPI|ED|An+exception\n");
            test.equal(notifyStream.popTestData(), null);
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
    },
    "Missing initialization" : function(test) {
        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(1);
        this.dataProvider.on('init', function(message, response) {
            // not expected
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        test.throws(function () {
            this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
        }, Error);
        test.done();
    },
    "Late initialization" : function(test) {
        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(2);
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
        overrideDataWithParameters.apply(this, [isSnapshotAvailable, null ]);

        var reqRespStream = this.reqRespStream;
        test.expect(4);
        this.dataProvider.on('subscribe', function(itemName, response) {
            test.equal(itemName, "An Item Name");
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
    },
    "Subscribe without snapshot" : function(test) {
        // also tests the default handler for 'init'
        var credentials = { user: "my_user", password: "my_password" };
        overrideDataWithParameters.apply(this, [  null, credentials ]);

        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(5);
        test.equal(reqRespStream.popTestData(), "1|RAC|S|user|S|my_user|S|password|S|my_password\n");
        test.equal(notifyStream.popTestData().substring(13), "|RAC|S|user|S|my_user|S|password|S|my_password\n");
        this.dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            test.equal(notifyStream.popTestData().substring(13), "|EOS|S|An+Item+Name|S|FAKEID\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
    },
    "Failed subscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(2);
        this.dataProvider.on('subscribe', function(itemName, response) {
            response.error("An exception", "subscription");
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|EU|An+exception\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
    },
    "Unsubscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(3);
        this.dataProvider.on('unsubscribe', function(itemName, response) {
            test.equal(itemName, "An Item Name");
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
            test.equal(reqRespStream.popTestData(), "FAKEID|USB|V\n");
            test.done();
        });
        this.reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        this.reqRespStream.pushTestData("FAKEID|USB|S|An+Item+Name\r\n");
    },
    "Late subscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        var dataProvider = this.dataProvider;
        var subNum = 0, unsubNum = 0, subNumQ = 0, unsubNumQ = 0;
        var sub1DelayedResponse;
        test.expect(15);
        dataProvider.on('init', function(message, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        dataProvider.on('subscribe', function(itemName, response) {
            subNum++;
            test.ok(true, subNum + ") subscribe has been called");
            // console.log(subNum + ") subscribe call " + itemName);
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
            }
        });
        dataProvider.on('unsubscribeInQueue', function(itemName) {
            unsubNumQ++;
            test.ok(true, unsubNumQ + ") unsubscribe in queue");
            // console.log(unsubNumQ + ") unsubscribe in queue " + itemName);
            if (unsubNumQ === 3) {
                // On unsub ID6 ***
                sub1DelayedResponse.success();
            }
        });
        dataProvider.on('unsubscribe', function(itemName, response) {
            unsubNum++;
            test.ok(true, unsubNum + ") unsubscribe has been called");
            // console.log(unsubNum + ") unsubscribe call " + itemName);
            if (unsubNum === 1) {
                // Called after ***
                response.success();
                test.equals(reqRespStream.popTestData(), "ID1|SUB|V\n");
                test.equals(reqRespStream.popTestData(), "ID2|USB|V\n");
                test.equals(reqRespStream.popTestData(), "ID3|SUB|EU|Subscribe+request+come+too+late\n");
                test.equals(reqRespStream.popTestData(), "ID4|USB|V\n");
                test.equals(reqRespStream.popTestData(), "ID5|SUB|EU|Subscribe+request+come+too+late\n");
                test.equals(reqRespStream.popTestData(), "ID6|USB|V\n");
                test.ok(typeof reqRespStream.popTestData() === "undefined");
                test.done();
            }
        });
        dataProvider.on('subscribeInQueue', function(itemName) {
            subNumQ++;
            test.ok(true, subNumQ + ") subscribe in queue");
            // console.log(subNumQ + ") subscribe in queue " + itemName);
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
        test.expect(17);
        dataProvider.on('init', function(message, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
        });
        dataProvider.on('subscribe', function(itemName, response) {
            subNum++;
            test.ok(true, subNum + ") subscribe has been called");
            // console.log(subNum + ") subscribe call " + itemName);
            if (subNum === 1) {
                response.success();
                test.equals(reqRespStream.popTestData(), "ID1|SUB|V\n");
            } else if (subNum === 2) {
                // Delay on 2nd sub
                subDelayedResp = response;
            } else if (subNum === 3) {
                // Sub ID7 at last
                response.success();
                test.equals(reqRespStream.popTestData(), "ID7|SUB|V\n");
                test.done();
            }

        });
        dataProvider.on('unsubscribeInQueue', function(itemName) {
            unsubNumQ++;
            test.ok(true, unsubNumQ + ") unsubscribe in queue");
            // console.log(unsubNumQ + ") unsubscribe in queue " + itemName);
            if (unsubNumQ === 2) {
                // On unsub ID6 ***
                subDelayedResp.success();
            }
        });
        dataProvider.on('unsubscribe', function(itemName, response) {
            unsubNum++;
            test.ok(true, unsubNum + ") unsubscribe has been called");
            // console.log(unsubNum + ") unsubscribe call " + itemName);
            if (unsubNum === 1) {
                response.success();
                test.equals(reqRespStream.popTestData(), "ID2|USB|V\n");
            } else if (unsubNum === 2) {
                response.success();
                test.equals(reqRespStream.popTestData(), "ID3|SUB|V\n");
                test.equals(reqRespStream.popTestData(), "ID4|USB|V\n");
                test.equals(reqRespStream.popTestData(), "ID5|SUB|EU|Subscribe+request+come+too+late\n");
                test.equals(reqRespStream.popTestData(), "ID6|USB|V\n");
                test.ok(typeof reqRespStream.popTestData() === "undefined");
            }
        });
        dataProvider.on('subscribeInQueue', function(itemName) {
            subNumQ++;
            test.ok(true, subNumQ + ") subscribe in queue");
            // console.log(subNumQ  + ") subscribe in queue " + itemName);
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
        var notifyStream = this.notifyStream;
        test.expect(1);
        this.dataProvider.failure("An exception");
        test.equal(notifyStream.popTestData().substring(13), "|FAL|E|An+exception\n");
        test.done();
    },
    "End of snapshot" : function(test) {
        var dataProvider = this.dataProvider;
        var reqRespStream = this.reqRespStream;
        var notifyStream = this.notifyStream;
        test.expect(1);
        dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            dataProvider.endOfSnapshot("An Item Name");
            test.equal(notifyStream.popTestData().substring(13), "|EOS|S|An+Item+Name|S|FAKEID\n");
            test.done();
        });
        reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
        reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
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
        var notifyStream = this.notifyStream;
        test.expect(2);

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
                "S|field1|S|A+string|S|field2|S|$|S|field3|S|#|" +
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
        var notifyStream = this.notifyStream;
        test.expect(3);

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
            dataProvider.clearSnapshot("AnItemName");
            test.equal(notifyStream.popTestData().substring(13), "|EOS|S|AnItemName|S|FAKEID\n");
            test.equal(notifyStream.popTestData().substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
                "S|field1|S|A+string|S|field2|S|$|S|field3|S|#|" +
                "S|field4|S|12.4|S|field5|S|true|S|field6|S|0|" +
                "S|field7|S|NaN|S|field8|S|undefined|S|field9|S|false\n");
            test.equal(notifyStream.popTestData().substring(13), "|CLS|S|AnItemName|S|FAKEID\n");
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
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
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
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
    },
};