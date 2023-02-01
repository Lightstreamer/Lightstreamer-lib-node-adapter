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

var dataProto = require('../lib/dataprotocol').data,
	DataReader = require('../lib/dataprotocol').DataReader;

var currProtocolVersion = "1.9.1";

exports.dataReads = {
	"Read a valid init" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|DPI|S|P1|S|V1|S|ARI.version|S|1.9.100|S|P2|S|V2|S|keepalive_hint.millis|S|8000\r\n", true, true);
		var msg = reader.pop();
		test.equal(msg.verb, "init");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.parameters["P1"], "V1");
		test.equal(msg.parameters["P2"], "V2");
		test.equal(msg.parameters["keepalive_hint.millis"], null);
		test.equal(msg.initResponseParams["ARI.version"], currProtocolVersion);
		test.done();
	},
	"Read a valid init and test old encoding" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|DPI|S|P1+%0D|S|V1+%F0%A9%A5%AA|S|P2+%24|S|%23|S|ARI.version|S|1.9.100|S|P3+%2B|S|V3+%C8%AC|S|P4+%7C|S|V4+%E2%82%AC\r\n", true, true);
		var msg = reader.pop();
		test.equal(msg.verb, "init");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.parameters["P1 \r"], "V1 𩥪");
		test.equal(msg.parameters["P2 $"], "#");
		test.equal(msg.parameters["P3 +"], "V3 Ȭ");
		test.equal(msg.parameters["P4 |"], "V4 €");
		test.equal(msg.initResponseParams["ARI.version"], currProtocolVersion);
		test.done();
	},
	"Read a valid init 1.8.2 to refuse" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|DPI|S|P1|S|V1|S|ARI.version|S|1.8.2|S|P2|S|V2|S|keepalive_hint.millis|S|8000\r\n", true, true);
		var msg = reader.pop();
		test.equal(msg.verb, "init");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.parameters["P1"], "V1");
		test.equal(msg.parameters["P2"], "V2");
		test.equal(msg.parameters["keepalive_hint.millis"], null);
		test.equal(msg.initResponseParams, null);
		test.done();
	},
	"Read a valid init 1.8.0 to refuse" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|DPI|S|P1|S|V1|S|P2|S|V2\r\n", true, true);
		var msg = reader.pop();
		test.equal(msg.verb, "init");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.parameters["P1"], "V1");
		test.equal(msg.parameters["P2"], "V2");
		test.equal(msg.initResponseParams, null);
		test.done();
	},
	"Read a valid subscribe" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|SUB|S|An Item Name\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "subscribe");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.itemName, "An Item Name");
		test.done();
	},
	"Read a valid unsubscribe" : function(test) {
		var reader = new DataReader();
		reader.parse("FAKEID|USB|S|An Item Name\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "unsubscribe");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.itemName, "An Item Name");
		test.done();
	},
	"Read an unknown message" : function(test) {
		test.throws(function() {
			var reader = new DataReader();
			reader.parse("FAKEID|WHAT|S|An Item Name\n", false, true);
		}, Error);
		test.done();
	},
	"Read an invalid message" : function(test) {
		test.throws(function() {
			var reader = new DataReader();
			reader.parse("FAKEID|WHAT|An Item Name\r\n", false, true);
		}, Error);
		test.done();
	},
	"Read a valid close" : function(test) {
		var reader = new DataReader();
		reader.parse("0|CLOSE|S|reason|S|keepalive+timeout\r\n", true, true);
		var msg = reader.pop();
		test.equal(msg.id, "0");
		test.equal(msg.parameters["reason"], "keepalive timeout");
		test.done();
	}
};

exports.dataWrites = {
	"Keepalive write" : function(test) {
		var msg = dataProto.writeKeepalive();
		test.equal(msg, "KEEPALIVE\n");
		test.done();
	},
	"Credentials write" : function(test) {
		var params = {};
		params["user"] = "my_user";
		params["password"] = "my_password";
		params["enableClosePacket"] = "true";
		var msg = dataProto.writeRemoteCredentials(params);
		test.equal(msg, "1|RAC|S|user|S|my_user|S|password|S|my_password|S|enableClosePacket|S|true\n");
		test.done();
	},
	"Credentials notif write" : function(test) {
		var params = {};
		params["user"] = "my_user";
		params["password"] = "my_password";
		var msg = dataProto.writeRemoteCredentialsOnNotif(params);
		test.equal(msg.substring(13), "|RAC|S|user|S|my_user|S|password|S|my_password\n");
		test.done();
	},
	"Init write" : function(test) {
		var params = {};
		params["ARI.version"] = currProtocolVersion;
		params["P1"] = "V1";
		var msg = dataProto.writeInit("FAKEID", params);
		test.equal(msg, "FAKEID|DPI|S|ARI.version|S|" + currProtocolVersion + "|S|P1|S|V1\n");
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
		test.equal(msg, "FAKEID|SUB|E|An exception\n");
		test.done();
	},
	"Subscribe write with subscription exception" : function(test) {
		var msg = dataProto.writeSubscribeException("FAKEID","An exception","subscription");
		test.equal(msg, "FAKEID|SUB|EU|An exception\n");
		test.done();
	},
	"Unsubscribe write" : function(test) {
		var msg = dataProto.writeUnsubscribe("FAKEID");
		test.equal(msg, "FAKEID|USB|V\n");
		test.done();
	},
	"Unsubscribe write with exception" : function(test) {
		var msg = dataProto.writeUnsubscribeException("FAKEID","An exception");
		test.equal(msg, "FAKEID|USB|E|An exception\n");
		test.done();
	},
	"Unsubscribe write with subscription exception" : function(test) {
		var msg = dataProto.writeUnsubscribeException("FAKEID","An exception","subscription");
		test.equal(msg, "FAKEID|USB|EU|An exception\n");
		test.done();
	},
	"Failure write" : function(test) {
		var msg = dataProto.writeFailure("An exception");
		test.equal(msg.substring(13), "|FAL|E|An exception\n");
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
	  var fake = "";
		var msg = dataProto.writeUpdate("FAKEID","AnItemName", true,
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
		test.equal(msg.substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
			"S|field1|S|A string|S|field2|S|$|S|field3|S|#|" +
			"S|field4|S|12.4|S|field5|S|true|S|field6|S|0|" +
			"S|field7|S|NaN|S|field8|S|undefined|S|field9|S|false\n");
		test.done();
	},
	"Write an update by hash and test new encoding" : function(test) {
		var msg = dataProto.writeUpdate("FAKEID","AnItemName", true,
			{
				"field1" : "A string",
				"field_\r" : "value𩥪",
				"field_$" : "#",
				"field_+" : "valueȬ",
				"field_|" : "value€"
			});
		test.equal(msg.substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
			"S|field1|S|A string|" +
			"S|field_%0D|S|value𩥪|S|field_$|S|%23|" +
			"S|field_%2B|S|valueȬ|S|field_%7C|S|value€\n");
		test.done();
	},
	"Write field diff order declaration" : function(test) {
		var msg = dataProto.writeFieldDiffOrder("FAKEID","AnItemName",
			{
				"field1" : [ "JSONPATCH" ],
				"field2" : null,
				"field3" : [],
				"field4" : [ "NONEXISTENT", "JSONPATCH" ],
				"field5" : [ "JSONPATCH", "DIFF_MATCH_PATCH" ]
			});
		test.equal(msg.substring(13), "|DFD|S|AnItemName|S|FAKEID|" +
			"S|field1|F|J|S|field2|F|#|S|field3|F|$|S|field4|F|J|S|field5|F|JM\n");
		test.done();
	}
};

