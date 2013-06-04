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

var DataProvider = require('../lib/lightstreamer-adapter').DataProvider,
    TestStream = require('./utils/teststream').TestStream;

exports.tests = {
	setUp: function (callback) {
        this.reqRespStream = new TestStream();
        this.notifyStream = new TestStream();
        this.dataProvider = new DataProvider(this.reqRespStream, this.notifyStream);
        callback();
    },
	"Subscribe with snapshot" : function(test) {
        this.reqRespStream = new TestStream();
            // we cannot keep the old reqRespStream, because it already has a 'data' handler
            // for this.dataProvider, and, after attaching it to a new DataProvider below,
            // the handler would have still been invoked
        var reqRespStream = this.reqRespStream;
        test.expect(3);
        this.dataProvider = new DataProvider(
            this.reqRespStream, this.notifyStream, function(itemName) {
                test.equal(itemName, "An Item Name");
                return true;
            });
        this.dataProvider.on('subscribe', function(itemName, response) {
            test.equal(itemName, "An Item Name");
            response.success();
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            test.done();                        
        });
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
	},
    "Subscribe without snapshot" : function(test) {
        this.reqRespStream = new TestStream();
            // we cannot keep the old reqRespStream, because it already has a 'data' handler
            // for this.dataProvider, and, after attaching it to a new DataProvider below,
            // the handler would have still been invoked
        var reqRespStream = this.reqRespStream,
            notifyStream = this.notifyStream;
        test.expect(2);
        this.dataProvider = new DataProvider(
            this.reqRespStream, this.notifyStream, function(itemName) {return false;});

        this.dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
            var data = notifyStream.popTestData();
            test.ok(data.substring(13), "|EOS|S|An+Item+Name|S|FAKEID\n");
            test.done();            
        });

        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
    },
	"Failed subscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(1);
        this.dataProvider.on('subscribe', function(itemName, response) {
            response.error("An exception", "subscription");
            test.equal(reqRespStream.popTestData(), "FAKEID|SUB|EU|An+exception\n");
            test.done();
        });
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
	},
    "Unsubscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        test.expect(2);
        this.dataProvider.on('unsubscribe', function(itemName, response) {
            test.equal(itemName, "An Item Name");
            response.success();
            test.equal(reqRespStream.popTestData(), "FAKEID|USB|V\n");
            test.done();
        });
        this.reqRespStream.pushTestData("FAKEID|USB|S|An+Item+Name\r\n");
    },
    "Late subscribe" : function(test) {
        var reqRespStream = this.reqRespStream;
        var dataProvider = this.dataProvider;
        var subNum = 0, unsubNum = 0, subNumQ = 0, unsubNumQ = 0;
        var sub1Response;
        test.expect(14);
        dataProvider.on('subscribe', function(itemName, response) {
            subNum++;
            test.ok(true, subNum + ") subscribe has been called");
            // console.log(subNum + ") subscribe call " + itemName);
            if (subNum === 1) {
                // Sub ID1
                sub1Response = response;
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
                sub1Response.success();
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
        test.expect(16);
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
        this.reqRespStream.pushTestData("ID1|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID2|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID3|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID4|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID5|SUB|S|item1\n");
        this.reqRespStream.pushTestData("ID6|USB|S|item1\n");
        this.reqRespStream.pushTestData("ID7|SUB|S|item1\n");
    },
    "Failure" : function(test) {
        test.expect(1);
        this.dataProvider.failure("An exception");
        var data = this.notifyStream.popTestData();
        test.equal(data.substring(13), "|FAL|E|An+exception\n");
        test.done();
    },
    "End of snapshot" : function(test) {
        var dataProvider = this.dataProvider,
            reqRespStream = this.reqRespStream,
            notifyStream = this.notifyStream;
        test.expect(1);
        dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            dataProvider.endOfSnapshot("An Item Name");
            var data = notifyStream.popTestData();
            test.equal(data.substring(13), "|EOS|S|An+Item+Name|S|FAKEID\n");
            test.done();
        });
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
        var dataProvider = this.dataProvider,
            reqRespStream = this.reqRespStream,
            notifyStream = this.notifyStream;
        test.expect(2);

        dataProvider.on('subscribe', function(itemName, response) {
            response.success();
            dataProvider.update("AnItemName", true,
                {
                    "field1" : "A string",
                    "field2" : "",
                    "field3" : null,
                    "field4" : 12.4,
                    "field5" : true
                });
            data = notifyStream.popTestData();
            test.equal(data.substring(13), "|EOS|S|AnItemName|S|FAKEID\n");
            data = notifyStream.popTestData();
            test.equal(data.substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
                "S|field1|S|A+string|S|field2|S|$|S|field3|S|#|" +
                "S|field4|S|12.4|S|field5|S|true\n");
            test.done();
        });

        reqRespStream.pushTestData("FAKEID|SUB|S|AnItemName\r\n");
    },
    "Update by hash with an unsubscribed item" : function(test) {
        test.expect(1);
        test.throws(function () {
            this.dataProvider.update("AnItemName", true, {"field1" : "A string"});
        }, Error);
        test.done();
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
        this.reqRespStream.pushTestData("FAKEID|SUB|S|An+Item+Name\r\n");
    },
};