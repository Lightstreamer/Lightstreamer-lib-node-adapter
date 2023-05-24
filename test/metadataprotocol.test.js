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

var metadataProto = require('../lib/metadataprotocol').metadata,
	MetadataReader = require('../lib/metadataprotocol').MetadataReader;

var currProtocolVersion = "1.9.1";

exports.metadataReads = {
	"Read a valid init" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|MPI|S|P1|S|V1|S|ARI.version|S|1.9.100|S|P2|S|V2|S|keepalive_hint.millis|S|8000\r\n", true, true);
		var msg = reader.pop();
		test.equal(msg.verb, "init");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.parameters["P1"], "V1");
		test.equal(msg.parameters["P2"], "V2");
		test.equal(msg.parameters["keepalive_hint.millis"], null);
		test.equal(msg.initResponseParams["ARI.version"], currProtocolVersion);
		test.done();
	},
	"Read a valid init 1.8.2 to refuse" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|MPI|S|P1|S|V1|S|ARI.version|S|1.8.2|S|P2|S|V2|S|keepalive_hint.millis|S|8000\r\n", true, true);
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
		var reader = new MetadataReader();
		reader.parse("FAKEID|MPI|S|P1|S|V1|S|P2|S|V2\r\n", true, true);
		var msg = reader.pop();
		test.equal(msg.verb, "init");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.parameters["P1"], "V1");
		test.equal(msg.parameters["P2"], "V2");
		test.equal(msg.initResponseParams, null);
		test.done();
	},
	"Read a valid get item data" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|GIT|S|An Item Name1|S|An Item Name2\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "getItemData");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.itemNames.length, 2);
		test.equal(msg.itemNames[0], "An Item Name1");
		test.equal(msg.itemNames[1], "An Item Name2");
		test.done();
	},
	"Read a valid notify user" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|NUS|S|user|S|password|S|header1|S|value 1|S|header2|S|value 2\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "notifyUser");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.userPassword, "password");
		test.equal(msg.headers["header1"], "value 1");
		test.equal(msg.headers["header2"], "value 2");
		test.done();
	},
	"Read a valid notify user and test new encoding" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|NUS|S|user|S|password|S|header %0D|S|value 𩥪|S|header $|S|%23|S|header %2B|S|value Ȭ|S|header %7C|S|value €\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "notifyUser");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.userPassword, "password");
		test.equal(msg.headers["header \r"], "value 𩥪");
		test.equal(msg.headers["header $"], "#");
		test.equal(msg.headers["header +"], "value Ȭ");
		test.equal(msg.headers["header |"], "value €");
		test.done();
	},
	"Read a valid notify user auth" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|NUA|S|user|S|password|S|principal|S|header1|S|value 1|S|header2|S|value 2\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "notifyUserAuth");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.userPassword, "password");
		test.equal(msg.clientPrincipal, "principal");
		test.equal(msg.headers["header1"], "value 1");
		test.equal(msg.headers["header2"], "value 2");
		test.done();
	},
	"Read a valid get schema" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|GSC|S|user|S|group|S|schema|S|FAKESESSID\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "getSchema");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.groupName, "group");
		test.equal(msg.schemaName, "schema");
		test.equal(msg.sessionId, "FAKESESSID");
		test.done();
	},
	"Read a valid get items" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|GIS|S|user|S|group|S|FAKESESSID\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "getItems");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.groupName, "group");
		test.equal(msg.sessionId, "FAKESESSID");
		test.done();
	},
	"Read a valid get user item data" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|GUI|S|user|S|item 1|S|item 2\r\nFAKEID|GUI|S|user|S|item 7\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "getUserItemData");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.itemNames.length, 2);
		test.equal(msg.itemNames[0], "item 1");
		test.equal(msg.itemNames[1], "item 2");
		var msg = reader.pop();
		test.equal(msg.itemNames[0], "item 7");
		test.done();
	},
	"Read a valid notify user message" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|NUM|S|user|S|FAKESESSID|S|This is a message\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "notifyUserMessage");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.sessionId, "FAKESESSID");
		test.equal(msg.userMessage, "This is a message");
		test.done();
	},
	"Read a valid notify new session" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|NNS|S|user|S|FAKESESSID|S|prop1|S|val1|S|prop2|S|val2\r\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "notifyNewSession");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.sessionId, "FAKESESSID");
		test.equal(msg.contextProperties["prop1"], "val1");
		test.equal(msg.contextProperties["prop2"], "val2");
		test.done();
	},
	"Read a valid notify session close" : function(test) {
		var reader = new MetadataReader();
		reader.parse("FAKEID|NSC|S|FAKESESSID\n", false, true);
		var msg = reader.pop();
		test.equal(msg.verb, "notifySessionClose");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.sessionId, "FAKESESSID");
		test.done();
	},
	"Read a valid notify new tables" : function(test) {
		var reader = new MetadataReader();
		var inMsg, msg, i;

		inMsg = "FAKEID|NNT|S|user|S|FAKESESSID" +
			"|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|5|S|#" +
			"|I|1|M|R|S|group2|S|data_adapter2|S|schema2|I|1|I|5|S|selector" +
			"|I|1|M|D|S|group3|S|data_adapter3|S|schema3|I|1|I|5|S|#" +
			"|I|1|M|C|S|group4|S|data_adapter4|S|schema4|I|1|I|5|S|#" +
			"\n";

		reader.parse(inMsg, false, true);
		msg = reader.pop();

		test.equal(msg.verb, "notifyNewTables");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.sessionId, "FAKESESSID");
		test.ok(msg.tableInfos);
		test.equal(msg.tableInfos.length, 4);

		test.strictEqual(msg.tableInfos[0].winIndex, 1);
		test.ok(msg.tableInfos[0].pubModes["merge"]);
		test.equal(msg.tableInfos[0].groupName, "group1");
		test.equal(msg.tableInfos[0].dataAdapter, "data_adapter1");
		test.equal(msg.tableInfos[0].schemaName, "schema1");
		test.strictEqual(msg.tableInfos[0].firstItemIndex, 1);
		test.strictEqual(msg.tableInfos[0].lastItemIndex, 5);
		test.strictEqual(msg.tableInfos[0].selector, null);

		test.strictEqual(msg.tableInfos[1].selector, "selector");
		test.ok(msg.tableInfos[1].pubModes["raw"]);

		test.ok(msg.tableInfos[2].pubModes["distinct"]);

		test.ok(msg.tableInfos[3].pubModes["command"]);
		test.equal(msg.tableInfos[3].groupName, "group4");
		test.equal(msg.tableInfos[3].dataAdapter, "data_adapter4");
		test.equal(msg.tableInfos[3].schemaName, "schema4");

		test.done();
	},
	"Read a valid notify tables close" : function(test) {
		var reader = new MetadataReader();
		var inMsg, msg, i;

		inMsg = "FAKEID|NTC|S|FAKESESSID" +
			"|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|5|S|#" +
			"|I|1|M|R|S|group2|S|data_adapter2|S|schema2|I|1|I|5|S|selector" +
			"\n";

		reader.parse(inMsg, false, true);
		msg = reader.pop();

		test.equal(msg.verb, "notifyTablesClose");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.sessionId, "FAKESESSID");
		test.ok(msg.tableInfos);
		test.equal(msg.tableInfos.length, 2);

		test.strictEqual(msg.tableInfos[0].winIndex, 1);
		test.ok(msg.tableInfos[0].pubModes["merge"]);
		test.equal(msg.tableInfos[0].groupName, "group1");
		test.equal(msg.tableInfos[0].dataAdapter, "data_adapter1");
		test.equal(msg.tableInfos[0].schemaName, "schema1");
		test.strictEqual(msg.tableInfos[0].firstItemIndex, 1);
		test.strictEqual(msg.tableInfos[0].lastItemIndex, 5);
		test.strictEqual(msg.tableInfos[0].selector, null);

		test.strictEqual(msg.tableInfos[1].selector, "selector");
		test.ok(msg.tableInfos[1].pubModes["raw"]);

		test.done();
	},
	"Read a valid notify MPN device access" : function(test) {
		var reader = new MetadataReader();
		var inMsg, msg, i;

		inMsg = "FAKEID|MDA|S|user|S|FAKESESSID" +
			"|P|A|S|appID|S|deviceToken" +
			"\n";

		reader.parse(inMsg, false, true);
		msg = reader.pop();

		test.equal(msg.verb, "notifyMpnDeviceAccess");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.sessionId, "FAKESESSID");
		test.equal(msg.device.mpnPlatformType, "A");
		test.equal(msg.device.applicationId, "appID");
		test.equal(msg.device.deviceToken, "deviceToken");

		test.done();
	},
	"Read a valid notify MPN APNS subscription activation" : function(test) {
		var reader = new MetadataReader();
		var inMsg, msg, i;

		inMsg = "FAKEID|MSA|S|user|S|FAKESESSID" +
			"|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|2" +
			"|P|A|S|appID|S|deviceToken|S|triggerExpression" +
			"|S|%7B%22aps%22%3A%7B%22alert%22%3A%22%24%7Bmessage%7D%22%2C%22badge%22%3A%22AUTO%22%7D%2C%22acme2%22%3A%5B%22%24%7Btag1%7D%22%2C%22%24%7Btag2%7D%22%5D%7D" +
			"\n";

		reader.parse(inMsg, false, true);
		msg = reader.pop();

		test.equal(msg.verb, "notifyMpnSubscriptionActivation");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.sessionId, "FAKESESSID");

		test.strictEqual(msg.tableInfo.winIndex, 1);
		test.ok(msg.tableInfo.pubModes["merge"]);
		test.equal(msg.tableInfo.groupName, "group1");
		test.equal(msg.tableInfo.dataAdapter, "data_adapter1");
		test.equal(msg.tableInfo.schemaName, "schema1");
		test.strictEqual(msg.tableInfo.firstItemIndex, 1);
		test.strictEqual(msg.tableInfo.lastItemIndex, 2);

		test.equal(msg.mpnSubscription.device.mpnPlatformType, "A");
		test.equal(msg.mpnSubscription.device.applicationId, "appID");
		test.equal(msg.mpnSubscription.device.deviceToken, "deviceToken");
		test.equal(msg.mpnSubscription.trigger, "triggerExpression");

		test.equal(msg.mpnSubscription.notificationFormat, "{\"aps\":{\"alert\":\"${message}\",\"badge\":\"AUTO\"},\"acme2\":[\"${tag1}\",\"${tag2}\"]}");

		test.done();
	},
	"Read a valid notify MPN GCM subscription activation" : function(test) {
		var reader = new MetadataReader();
		var inMsg, msg, i;

		inMsg = "FAKEID|MSA|S|user|S|FAKESESSID" +
			"|I|1|M|M|S|group1|S|data_adapter1|S|schema1|I|1|I|2" +
			"|P|G|S|appID|S|deviceToken|S|triggerExpression" + 
			"|S|%7B%22priority%22%3A%22NORMAL%22%2C%22notification%22%3A%7B%22icon%22%3A%22my_icon%22%2C%22body%22%3A%22my_body%22%2C%22title%22%3A%22my_title%22%7D%7D" +
			"\n";

		reader.parse(inMsg, false, true);
		msg = reader.pop();

		test.equal(msg.verb, "notifyMpnSubscriptionActivation");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.sessionId, "FAKESESSID");

		test.strictEqual(msg.tableInfo.winIndex, 1);
		test.ok(msg.tableInfo.pubModes["merge"]);
		test.equal(msg.tableInfo.groupName, "group1");
		test.equal(msg.tableInfo.dataAdapter, "data_adapter1");
		test.equal(msg.tableInfo.schemaName, "schema1");
		test.strictEqual(msg.tableInfo.firstItemIndex, 1);
		test.strictEqual(msg.tableInfo.lastItemIndex, 2);

		test.equal(msg.mpnSubscription.device.mpnPlatformType, "G");
		test.equal(msg.mpnSubscription.device.applicationId, "appID");
		test.equal(msg.mpnSubscription.device.deviceToken, "deviceToken");
		test.equal(msg.mpnSubscription.trigger, "triggerExpression");

		test.equal(msg.mpnSubscription.notificationFormat, "{\"priority\":\"NORMAL\",\"notification\":{\"icon\":\"my_icon\",\"body\":\"my_body\",\"title\":\"my_title\"}}");

		test.done();
	},
	"Read a valid notify MPN device token change" : function(test) {
		var reader = new MetadataReader();
		var inMsg, msg, i;

		inMsg = "FAKEID|MDC|S|user|S|FAKESESSID" +
			"|P|G|S|appID|S|deviceToken|S|deviceToken2" +
			"\n";

		reader.parse(inMsg, false, true);
		msg = reader.pop();

		test.equal(msg.verb, "notifyMpnDeviceTokenChange");
		test.equal(msg.id, "FAKEID");
		test.equal(msg.userName, "user");
		test.equal(msg.sessionId, "FAKESESSID");
		test.equal(msg.device.mpnPlatformType, "G");
		test.equal(msg.device.applicationId, "appID");
		test.equal(msg.device.deviceToken, "deviceToken");
		test.equal(msg.newDeviceToken, "deviceToken2");

		test.done();
	},
	"Read a valid close" : function(test) {
		var reader = new MetadataReader();
		reader.parse("0|CLOSE|S|reason|S|keepalive+timeout\r\n", true, true);
		var msg = reader.pop();
		test.equal(msg.id, "0");
		test.equal(msg.parameters["reason"], "keepalive timeout");
		test.done();
	}
};

exports.metadataWrites = {
	"Keepalive write" : function(test) {
		var msg = metadataProto.writeKeepalive();
		test.equal(msg, "KEEPALIVE\n");
		test.done();
	},
	"Credentials write" : function(test) {
		var params = {};
		params["user"] = "my_user";
		params["password"] = "my_password";
		params["enableClosePacket"] = "true";
		params["SDK"] = "Node.js Adapter SDK";
		var msg = metadataProto.writeRemoteCredentials(params);
		test.equal(msg, "1|RAC|S|user|S|my_user|S|password|S|my_password|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
		test.done();
	},
	"Credentials write and test old encoding" : function(test) {
		var params = {};
		params["user"] = "my_user_\r";
		params["password"] = "my_password_𩥪";
		params["enableClosePacket"] = "true";
		params["extra $"] = "#";
		params["extra +"] = "Ȭ";
		params["extra |"] = "€";
		var msg = metadataProto.writeRemoteCredentials(params);
		test.equal(msg, "1|RAC|S|user|S|my_user_%0D|S|password|S|my_password_%F0%A9%A5%AA|S|enableClosePacket|S|true|S|extra+%24|S|%23|S|extra+%2B|S|%C8%AC|S|extra+%7C|S|%E2%82%AC\n");
		test.done();
	},
	"Init write" : function(test) {
		var params = {};
		params["ARI.version"] = currProtocolVersion;
		params["P1"] = "V1";
		var msg = metadataProto.writeInit("FAKEID", params);
		test.equal(msg, "FAKEID|MPI|S|ARI.version|S|" + currProtocolVersion + "|S|P1|S|V1\n");
		test.done();
	},
	"Write a valid get schema response" : function(test) {
		var msg = metadataProto.writeGetSchema("FAKEID",["Field 1","Field 2"]);
		test.equal(msg, "FAKEID|GSC|S|Field 1|S|Field 2\n");
		test.done();
	},
	"Write a valid get item data response" : function(test) {
		var msg = metadataProto.writeGetItemData("FAKEID",[
			{distinctSnapLen: 10, minSourceFreq: 0.5, allowedModes: {raw: true, merge: true}},
			{distinctSnapLen: 5, minSourceFreq: 0, allowedModes: {distinct: true}},
		]);
		test.equal(msg, "FAKEID|GIT|I|10|D|0.5|M|RM|I|5|D|0|M|D\n");
		test.done();
	},
	"Write a valid get user item data response" : function(test) {
		var msg = metadataProto.writeGetUserItemData("FAKEID",[
			{allowedBufferSize: 30, allowedMaxItemFreq: 3, allowedModes: {raw: true, merge: true, distinct:true, command: true}},
			{allowedBufferSize: 40, allowedMaxItemFreq: 2.25, allowedModes: {merge: true}},
		]);
		test.equal(msg, "FAKEID|GUI|I|30|D|3|M|RMDC|I|40|D|2.25|M|M\n");
		test.done();
	},
	"Write a valid get items response" : function(test) {
		var msg = metadataProto.writeGetItems("FAKEID",["Item 1","Item 2"]);
		test.equal(msg, "FAKEID|GIS|S|Item 1|S|Item 2\n");
		test.done();
	},
	"Write a valid notify user response" : function(test) {
		var msg = metadataProto.writeNotifyUser("FAKEID", 12.34, true);
		test.equal(msg, "FAKEID|NUS|D|12.34|B|1\n");
		test.done();
	},
	"Write a valid notify user message response" : function(test) {
		var msg = metadataProto.writeNotifyUserMessage("FAKEID");
		test.equal(msg, "FAKEID|NUM|V\n");
		test.done();
	},
	"Write a valid notify new session response" : function(test) {
		var msg = metadataProto.writeNotifyNewSession("FAKEID");
		test.equal(msg, "FAKEID|NNS|V\n");
		test.done();
	},
	"Write a valid notify session close response" : function(test) {
		var msg = metadataProto.writeNotifySessionClose("FAKEID");
		test.equal(msg, "FAKEID|NSC|V\n");
		test.done();
	},
	"Write a valid notify new tables response" : function(test) {
		var msg = metadataProto.writeNotifyNewTables("FAKEID");
		test.equal(msg, "FAKEID|NNT|V\n");
		test.done();
	},
	"Write a valid notify tables close response" : function(test) {
		var msg = metadataProto.writeNotifyTablesClose("FAKEID");
		test.equal(msg, "FAKEID|NTC|V\n");
		test.done();
	},
	"Write a valid notify MPN device access response" : function(test) {
		var msg = metadataProto.writeNotifyMpnDeviceAccess("FAKEID");
		test.equal(msg, "FAKEID|MDA|V\n");
		test.done();
	},
	"Write a valid notify MPN subscription activation response" : function(test) {
		var msg = metadataProto.writeNotifyMpnSubscriptionActivation("FAKEID");
		test.equal(msg, "FAKEID|MSA|V\n");
		test.done();
	},
	"Write a valid notify MPN device token change" : function(test) {
		var msg = metadataProto.writeNotifyMpnDeviceTokenChange("FAKEID");
		test.equal(msg, "FAKEID|MDC|V\n");
		test.done();
	}
};

exports.metadataExceptionWrites = {
	"Write generic exception for init" : function(test) {
		var msg = metadataProto.writeInitException("FAKEID","A Message");
		test.equal(msg, "FAKEID|MPI|E|A+Message\n");
		test.done();
	},
	"Write generic exception for getItemData" : function(test) {
		var msg = metadataProto.writeGetItemDataException("FAKEID","A Message");
		test.equal(msg, "FAKEID|GIT|E|A Message\n");
		test.done();
	},
	"Write generic exception for notifyUser" : function(test) {
		var msg = metadataProto.writeNotifyUserException("FAKEID","A Message");
		test.equal(msg, "FAKEID|NUS|E|A Message\n");
		test.done();
	},
	"Write generic exception for notifyUserAuth" : function(test) {
		var msg = metadataProto.writeNotifyUserAuthException("FAKEID","A Message");
		test.equal(msg, "FAKEID|NUA|E|A Message\n");
		test.done();
	},
	"Write generic exception for getSchema" : function(test) {
		var msg = metadataProto.writeGetSchemaException("FAKEID","A Message");
		test.equal(msg, "FAKEID|GSC|E|A Message\n");
		test.done();
	},
	"Write generic exception for getItems" : function(test) {
		var msg = metadataProto.writeGetItemsException("FAKEID","A Message");
		test.equal(msg, "FAKEID|GIS|E|A Message\n");
		test.done();
	},
	"Write generic exception for getUserItemData" : function(test) {
		var msg = metadataProto.writeGetUserItemDataException("FAKEID","A Message");
		test.equal(msg, "FAKEID|GUI|E|A Message\n");
		test.done();
	},
	"Write generic exception for notifyUserMessage" : function(test) {
		var msg = metadataProto.writeNotifyUserMessageException("FAKEID","A Message");
		test.equal(msg, "FAKEID|NUM|E|A Message\n");
		test.done();
	},
	"Write generic exception for notifyNewSession" : function(test) {
		var msg = metadataProto.writeNotifyNewSessionException("FAKEID","A Message");
		test.equal(msg, "FAKEID|NNS|E|A Message\n");
		test.done();
	},
	"Write generic exception for notifySessionClose" : function(test) {
		var msg = metadataProto.writeNotifySessionCloseException("FAKEID","A Message");
		test.equal(msg, "FAKEID|NSC|E|A Message\n");
		test.done();
	},
	"Write generic exception for notifyNewTables" : function(test) {
		var msg = metadataProto.writeNotifyNewTablesException("FAKEID","A Message");
		test.equal(msg, "FAKEID|NNT|E|A Message\n");
		test.done();
	},
	"Write generic exception for notifyTablesClose" : function(test) {
		var msg = metadataProto.writeNotifyTablesCloseException("FAKEID","A Message");
		test.equal(msg, "FAKEID|NTC|E|A Message\n");
		test.done();
	},
	"Write credits exception for notifyMpnDeviceAccess" : function(test) {
		var excData = {clientCode: -1, clientMessage: "Message for client"};
		var msg = metadataProto.writeNotifyMpnDeviceAccessException("FAKEID","A Message","credits",excData);
		test.equal(msg, "FAKEID|MDA|EC|A Message|-1|Message for client\n");
		test.done();
	},
	"Write credits exception for notifyMpnSubscriptionActivation" : function(test) {
		var excData = {clientCode: -1, clientMessage: "Message for client"};
		var msg = metadataProto.writeNotifyMpnSubscriptionActivationException("FAKEID","A Message","credits",excData);
		test.equal(msg, "FAKEID|MSA|EC|A Message|-1|Message for client\n");
		test.done();
	},
	"Write credits exception for notifyMpnDeviceTokenChange" : function(test) {
		var excData = {clientCode: -1, clientMessage: "Message for client"};
		var msg = metadataProto.writeNotifyMpnDeviceTokenChangeException("FAKEID","A Message","credits",excData);
		test.equal(msg, "FAKEID|MDC|EC|A Message|-1|Message for client\n");
		test.done();
	},
	"Write metadata exception for init" : function(test) {
		var msg = metadataProto.writeInitException("FAKEID","A Message","metadata");
		test.equal(msg, "FAKEID|MPI|EM|A+Message\n");
		test.done();
	},
	"Write access exception for notifyUser" : function(test) {
		var msg = metadataProto.writeNotifyUserException("FAKEID","A Message","access");
		test.equal(msg, "FAKEID|NUS|EA|A Message\n");
		test.done();
	},
	"Write credits exception for notifyUser" : function(test) {
		var excData = {clientCode: -1, clientMessage: "Message for client"};
		var msg = metadataProto.writeNotifyUserException("FAKEID","A Message","credits",excData);
		test.equal(msg, "FAKEID|NUS|EC|A Message|-1|Message for client\n");
		test.done();
	},
	"Write conflicting session exception for notifyNewSession" : function(test) {
		var excData = {clientCode: -1, clientMessage: "Message for client", conflictingSessionId: "SXXXXXXXXXXXXXXXXX"};
		var msg = metadataProto.writeNotifyNewSessionException("FAKEID","A Message","conflictingSession",excData);
		test.equal(msg, "FAKEID|NNS|EX|A Message|-1|Message for client|SXXXXXXXXXXXXXXXXX\n");
		test.done();
	},
	"Write notification exception for notifyNewSession" : function(test) {
		var msg = metadataProto.writeNotifyNewSessionException("FAKEID","A Message","notification");
		test.equal(msg, "FAKEID|NNS|EN|A Message\n");
		test.done();
	},
	"Write notification exception for notifyNewSession" : function(test) {
		var msg = metadataProto.writeNotifyNewSessionException("FAKEID","A Message","notification");
		test.equal(msg, "FAKEID|NNS|EN|A Message\n");
		test.done();
	},
	"Write items exception for getSchema" : function(test) {
		var msg = metadataProto.writeGetSchemaException("FAKEID","A Message","items");
		test.equal(msg, "FAKEID|GSC|EI|A Message\n");
		test.done();
	},
	"Write schema exception for getSchema" : function(test) {
		var msg = metadataProto.writeGetSchemaException("FAKEID","A Message","schema");
		test.equal(msg, "FAKEID|GSC|ES|A Message\n");
		test.done();
	}
};
