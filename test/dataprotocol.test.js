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

var dataProto = require('../lib/dataprotocol').data,
	DataReader = require('../lib/dataprotocol').DataReader;

exports.dataReads = {
	"Read a valid init" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|DPI|S|P1|S|V1|S|P2|S|V2\r\n", true);
		var msg = reader.pop();
		test.equal(msg.verb, "init");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.parameters["P1"], "V1");
		test.equal(msg.parameters["P2"], "V2");
		test.done();
	},
	"Read a valid subscribe" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|SUB|S|An+Item+Name\r\n", false);
		var msg = reader.pop();
		test.equal(msg.verb, "subscribe");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.itemName, "An Item Name");
		test.done();
	},
	"Read a valid unsubscribe" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|USB|S|An+Item+Name\n", false);
		var msg = reader.pop();
		test.equal(msg.verb, "unsubscribe");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.itemName, "An Item Name");
		test.done();
	},
	"Read an unknown message" : function(test) {
		test.throws(function() {
			var reader = new DataReader();
			reader.parse("FAKEID|WHAT|S|An+Item+Name\n", false);
		}, Error);
		test.done();
	},
	"Read an invalid message" : function(test) {
		test.throws(function() {
			var reader = new DataReader();
			reader.parse("FAKEID|WHAT|An+Item+Name\r\n", false);
		}, Error);
		test.done();
	}
};

exports.dataWrites = {
	"Init write" : function(test) {
		var msg = dataProto.writeInit("FAKEID");
		test.equal(msg, "FAKEID|DPI|V\n");
		test.done();
	},
	"Init write with exception" : function(test) {
		var msg = dataProto.writeInitException("FAKEID","An exception");
		test.equal(msg, "FAKEID|DPI|E|An+exception\n");
		test.done();
	},
	"Init write with data exception" : function(test) {
		var msg = dataProto.writeInitException("FAKEID","An exception","data");
		test.equal(msg, "FAKEID|DPI|ED|An+exception\n");
		test.done();
	},
	"Subscribe write" : function(test) {
		var msg = dataProto.writeSubscribe("FAKEID");
		test.equal(msg, "FAKEID|SUB|V\n");
		test.done();
	},
	"Subscribe write with exception" : function(test) {
		var msg = dataProto.writeSubscribeException("FAKEID","An exception");
		test.equal(msg, "FAKEID|SUB|E|An+exception\n");
		test.done();
	},
	"Subscribe write with subscription exception" : function(test) {
		var msg = dataProto.writeSubscribeException("FAKEID","An exception","subscription");
		test.equal(msg, "FAKEID|SUB|EU|An+exception\n");
		test.done();
	},
	"Unsubscribe write" : function(test) {
		var msg = dataProto.writeUnsubscribe("FAKEID");
		test.equal(msg, "FAKEID|USB|V\n");
		test.done();
	},
	"Unsubscribe write with exception" : function(test) {
		var msg = dataProto.writeUnsubscribeException("FAKEID","An exception");
		test.equal(msg, "FAKEID|USB|E|An+exception\n");
		test.done();
	},
	"Unsubscribe write with subscription exception" : function(test) {
		var msg = dataProto.writeUnsubscribeException("FAKEID","An exception","subscription");
		test.equal(msg, "FAKEID|USB|EU|An+exception\n");
		test.done();
	},
	"Failure write" : function(test) {
		var msg = dataProto.writeFailure("An exception");
		test.equal(msg.substring(13), "|FAL|E|An+exception\n");
		test.done();
	},
	"End of snapshot write" : function(test) {
		var msg = dataProto.writeEndOfSnapshot("FAKEID","AnItemId");
		test.equal(msg.substring(13), "|EOS|S|AnItemId|S|FAKEID\n");
		test.done();
	},
	"Clear snapshot write" : function(test) {
		var msg = dataProto.writeClearSnapshot("FAKEID","AnItemId");
		test.equal(msg.substring(13), "|CLS|S|AnItemId|S|FAKEID\n");
		test.done();
	},
	"Write an update by hash" : function(test) {
		var msg = dataProto.writeUpdate("FAKEID","AnItemName", true,
			{
				"field1" : "A string",
				"field2" : "",
				"field3" : null,
				"field4" : 12.4,
				"field5" : true
			});
		test.equal(msg.substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
			"S|field1|S|A+string|S|field2|S|$|S|field3|S|#|" +
			"S|field4|S|12.4|S|field5|S|true\n");
		test.done();
	}
};

