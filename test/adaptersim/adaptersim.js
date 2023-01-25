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

// Imports
var DataProvider = require('lightstreamer-adapter').DataProvider,
	net = require('net'),
	TestStream = require('../utils/teststream').TestStream;

// Remote proxy host and ports
var	HOST = 'localhost',
	REQ_RESP_PORT = 10001;

var adapterConf = {
	bytesPerField: 10,
	updateIntervalMillis: 500,
	itemBurst: 10,
	initWaitMillis: 2000,
	delayItemStartMillis: 1,
};

var serverConf = {
	numberOfItems: "500",
	numberOfFields: "5",
	subscriptionMode: "RAW",
	unfilteredSubscription: "1",
	// resamplingFrequency: "1.5",
	// resamplingBufferSize: "10",
};

// Request/response socket channel
var	reqRespStream;

// The data provider object
var	dataProvider;

// Item names subscribed
var items = {};

// Total items subscribed
var itemsNum = 0;

// Fixed field data
var fieldData = '', fdi;
for (fdi = 0; fdi < adapterConf.bytesPerField - 1; fdi++) {
	fieldData = fieldData + 'A';
}

// Num of updates
var numOfUpdates = 0;

// Variable field data
var varFieldData = 64;

// Simulate server connection
var stubStream = true;

if (!stubStream) {
	// Create socket connections
	reqRespStream = net.createConnection(REQ_RESP_PORT, HOST);
} else {
	reqRespStream =  new TestStream();
}

// Create the data provider object from the lightstreamer module
dataProvider = new DataProvider(reqRespStream, function(itemName) {
	return itemName === "CONFIGURATION";	
});

// Handle subscribe event
dataProvider.on('subscribe', function(itemName, resp) {
	if (itemName === "CONFIGURATION") {
		console.log("Subscribe config item " + itemName);
		resp.success();
		pushConfig();
	} else if (itemName.match('^i')) {
		console.log("Subscribe data item " + itemName);
		items[itemName] = true;
		itemsNum++;
		resp.success();
	} else {
		console.log("Unexpected item " + itemName);
		resp.error("Unexpected item " + itemName);
	}
});

// Handle unsubscribe event
dataProvider.on('unsubscribe', function(itemName, resp) {
	if (itemName === "CONFIGURATION") {
		console.log("Unsubscribe config item " + itemName);
		resp.success();
	} else if (itemName.match('^i')) {
		console.log("Unsubscribe data item " + itemName);
		items[itemName] = undefined;
		itemsNum--;
		resp.success();
	} else {
		console.log("Unexpected item " + itemName);
		resp.error("Unexpected item " + itemName);
	}
});

function pushConfig() {
	dataProvider.update("CONFIGURATION", true, serverConf);
}

function start() {
	console.log("Start pushing...");
	setInterval(loop, adapterConf.updateIntervalMillis);
}

function loop() {
	if (itemsNum > 0) {
		// console.log("Push time for " + itemsNum + " items");
		setTimeout(push, adapterConf.delayItemStartMillis, 0);
	} else {
		console.log("Nothing to do. No items subscribed");				
	}
}

function push(firstItem) {
	var start = new Date().getTime();
	var nextItem = firstItem + adapterConf.itemBurst;
	pushSlot(firstItem, nextItem);
	// Next slot ?
	if (nextItem < serverConf.numberOfItems) {
		var deltaDelay = adapterConf.itemBurst * adapterConf.delayItemStartMillis;
		var elapsed = new Date().getTime() - start;
		var delay = Math.max(deltaDelay - elapsed, 0);
		//console.log("Next push slot from " + nextItem + " in " + delay + " (delata: " + deltaDelay + " elapsed: " + elapsed + ")");
		setTimeout(push, delay, nextItem);
	} else {
		console.log("Push loop " + (++numOfUpdates) + " completed");		
	}
}

function pushSlot(firstItem, nextItem) {
	var i, f, data = {}, fieldData = nextFieldData();
	for (f = 0; f < serverConf.numberOfFields; f++) {
		var fieldName = 'f' + (f + 1);
		data[fieldName] = fieldData;
	}
	for (i = firstItem; i < nextItem; i++) {
		var itemName = 'i' + (i + 1);
		if (items[itemName]) {
			dataProvider.update('i' + (i + 1), false, data);
		}
	}
}

function nextFieldData() {
	// Loop from A to Z
	varFieldData = varFieldData > 89 ? 65 : varFieldData + 1;
	return String.fromCharCode(varFieldData) + fieldData;
}

// Start update looping after initial pause
setTimeout(start, adapterConf.initWaitMillis);

if (stubStream) {
	var i;
	for (i = 0; i < serverConf.numberOfItems; i++) {
		var itemName = 'i' + (i + 1);
		reqRespStream.pushTestData("FAKEID|SUB|S|" + itemName + "\n");
	}
}
