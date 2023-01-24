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

/**
 * @module lightstreamer-adapter/dataprovider
 */

// Module imports
var EventEmitter = require('events').EventEmitter;
var baseProto =  require('./baseprotocol');
var proto = require('./dataprotocol').data;
var DataReader = require('./dataprotocol').DataReader;
var inspect = require('util').inspect;
var constants = require('./consts').constants;
var specialParameters = require('./consts').specialParameters;

/**
 * Data provider constructor.<br>
 * The created object allows you to interact with Lightstreamer Server through
 * the Adapter Remoting Infrastructure protocol as a Remote Data Adapter.
 * See the ARI Protocol documentation for details on the request and response
 * messages.<br>
 * This object extends the EventEmitter object and emits the following events:
 * <ul>
 * <li>init: function(request, response) {}<br/>
 * Here, the request object is an associative array with the following content:
 * {parameters: {&lt;name 1&gt;: &lt;value 1&gt; ... &lt;name n&gt;: &lt;value n&gt;}}</li>
 * <li>subscribe: function(itemName, response) {}</li>
 * <li>unsubscribe: function(itemName, response) {}</li>
 * </ul>
 * The response argument is a DataResponse object and one of its methods, error or success, must be called
 * in order to reply to the request bound to the event.
 * @class
 * @param {Stream} reqRespStream the request/reply stream channel to the remote LS Proxy Data Adapter.
 * In case of interruption, the 'error' event on the stream may report interruption cause details.
 * @param {Stream} [notifyStream] optional stream to be left undefined, or null,
 * unless connecting with an old Proxy Data Adapter, based on two-connections behavior,
 * to achieve backward compatibility with Server version earlier than 7.4,
 * in which case it is the asynchronous stream channel to the remote LS Proxy Data Adapter.
 * In fact, the configuration for old Proxy Data Adapters required the specification of a "notify" port,
 * to which a second connection should be opened, with its own stream.
 * @param {Function} [isSnapshotAvailable] optional callback that receives an itemName as argument and must return
 * a boolean value asserting if the item supports snapshot. The default value is function(itemName) {return false;}
 * @param {Object} [credentials] optional credentials to be submitted to the remote LS Proxy Data Adapter.
 * The credentials are needed only if the Proxy Adapter is configured to require Remote Adapter authentication.
 * If needed, the supplied object should contain both a "user" and a "password" field.
 * @param {Number} [keepaliveInterval] optional time in milliseconds between subsequent keepalive packets
 * to be sent on the reply and notify streams to prevent LS Proxy Data Adapter and any intermediate nodes
 * from closing the connection for inactivity; a value of 0 or negative means no keepalives; the default
 * if not supplied is 10000 ms. However, if a stricter interval is requested by the Proxy Adapter
 * on startup, it will be obeyed (with a safety minimum of 1 second). This should ensure that the
 * Proxy Adapter activity checks will always succeed, but for some old versions of the Proxy Adapter.
 * The keepalives can also allow for prompt detection of connection issues.
 */
function DataProvider(reqRespStream, notifyStream, isSnapshotAvailable, credentials, keepaliveInterval) {

		// the ref to the object that is being constructed
	var that;
		
		// registered handlers for the incoming messages
	var handlers;

		// track active subscriptions and the request id's
		// subscritions[ITEM_NAME] = RQUEST_ID
	var subscritions = {};

		// track subscribe/unsubscribe requests
		// subUnsubQueue[ITEM_NAME] = [{message, response}, ...]
	var subUnsubQueue = {};

		// the data in parser
	var reader = new DataReader();

	// init message expected immediately (apart from a close message)
	var initPending = true;

	// stream used internally for notifications
	var currNotifyStream = null;

	// Default value for notifyStream
	notifyStream = notifyStream || null; 

	// Default value for snapshot callback
	isSnapshotAvailable = isSnapshotAvailable || function(itemName) {return false;}; 

	// Default empty credentials
	credentials = credentials || {}; 

	// Default keepalive interval
	keepaliveInterval = keepaliveInterval || constants.DEFAULT_KEEPALIVE_MILLIS; 
		// we can wait for the Proxy's initialization message before issuing keepalives

	// Init streams
	reqRespStream.setEncoding("utf8");
	reqRespStream.on('data', handleIncomingMessage);
	if (notifyStream == null) {
		// normal case
		currNotifyStream = reqRespStream
	} else if (notifyStream == reqRespStream) {
		// case not explicitly documented but accepted
		currNotifyStream = reqRespStream
	} else {
		// backward compatibility case
		currNotifyStream = notifyStream
	}
	if (currNotifyStream != reqRespStream) {
		currNotifyStream.setEncoding("utf8");
	}

	var credentialParams = baseProto.getCredentials(credentials, true);
	if (credentialParams != null) {
		reqRespStream.write(proto.writeRemoteCredentials(credentialParams));
		if (currNotifyStream != reqRespStream) {
			currNotifyStream.write(proto.writeRemoteCredentialsOnNotif(credentialParams));
		}
	}

	/**
	 * Starts a loop of keepalive packets, if configured
	 *
	 * @param {Number} keepaliveHint the interval requested by the Proxy Adapter
	 * @private
	 */
	function startKeepalives(keepaliveHint) {
		var ok = true;
		baseProto.handleKeepalives(keepaliveInterval, keepaliveHint, function() {
			reqRespStream.write(proto.writeKeepalive());
			if (currNotifyStream != reqRespStream) {
				currNotifyStream.write(proto.writeKeepalive());
			}
			return ok;
		});
		reqRespStream.on('close', function() { ok = false; });
		if (currNotifyStream != reqRespStream) {
			currNotifyStream.on('close', function() { ok = false; });
		}
	}

	/**
	 * Callback for the incoming data from the stream
	 *
	 * @param {String} data the incoming request string
	 * @private
	 */
	function handleIncomingMessage(data) {
		var message;
		reader.parse(data, initPending);
		while (!reader.isEmpty()) {
			message = reader.pop();
			// console.log("IN MESSAGE: " + inspect(message));
			// internal part:
			if (message.verb === "init") {
				initPending = false;
				if (message.initResponseParams == null) {
					// unsupported version (see above)
					reply(proto.writeInitException(message.id, "Unsupported protocol version", "data"));
					return;
				}
			} else if (message.verb === "close") {
				var closeReason = message.parameters[specialParameters.KEY_CLOSE_REASON];
				that.emit("closeMessage", closeReason); // not public, only for tests
				if (closeReason != null) {
					reqRespStream.destroy(new Error("Close requested by the counterpart with reason: " + closeReason));
				} else {
					reqRespStream.destroy(new Error("Close requested by the counterpart"));
				}
				return;
			}
			handlers[message.verb](message);
		}
	}

	/**
	 * Write to reqResp stream
	 *
	 * @param {String} data the message string
	 * @private
	 */
	function reply(data) {
		// console.log("REPLY MESSAGE: " + inspect(data));
		reqRespStream.write(data);
	}

	/**
	 * Write to notify stream
	 *
	 * @param {String} data the message string
	 * @private
	 */
	function notify(data) {
		// console.log("NOTIFY MESSAGE: " + inspect(data));
		currNotifyStream.write(data);
	}

	/**
	 * Sends a subscribe reply
	 *
	 * @param {Object} message the decoded request message
	 * @private
	 */
	function subscribe(message) {
		reply(proto.writeSubscribe(message.id));
		subscritions[message.itemName] = message.id;
		if (!isSnapshotAvailable(message.itemName)) {
			notify(proto.writeEndOfSnapshot(message.id, message.itemName));
		}
		dequeueSubUnsubRequest(message.itemName);
		fireFirstSubUnsubEvent(message.itemName);
	}

	/**
	 * Sends a subscribe error reply
	 *
	 * @param {Object} message the decoded request message
	 * @private
	 */
	function subscribeError(message, exceptionMessage, exceptionType) {
		reply(proto.writeSubscribeException(
			message.id, exceptionMessage, exceptionType));
		dequeueSubUnsubRequest(message.itemName);
		fireFirstSubUnsubEvent(message.itemName);
	}

	/**
	 * Sends an unsubscribe reply
	 *
	 * @param {Object} message the decoded request message
	 * @private
	 */
	function unsubscribe(message) {
		reply(proto.writeUnsubscribe(message.id));
		subscritions[message.itemName] = undefined;
		dequeueSubUnsubRequest(message.itemName);
		handleLateSubUnsubRequests(message.itemName);
		fireFirstSubUnsubEvent(message.itemName);
	}

	/**
	 * Sends an unsubscribe error reply
	 *
	 * @param {Object} message the decoded request message
	 * @private
	 */
	function unsubscribeError(message, exceptionMessage, exceptionType) {
		reply(proto.writeUnsubscribeException(
			message.id, exceptionMessage, exceptionType));
		dequeueSubUnsubRequest(message.itemName);
		fireFirstSubUnsubEvent(message.itemName);
	}

	/**
	 * Add a subscribe/unsubscribe request to the queue
	 *
	 * @param {Object} message the decoded request message
	 * @param {DataResponse} response the response object
	 * @private
	 */
	function queueSubUnsubRequest(message, response) {
		if (typeof subUnsubQueue[message.itemName] === 'undefined') {
			subUnsubQueue[message.itemName] = [];
		}
		subUnsubQueue[message.itemName].push({'message': message, 'response': response});
		return subUnsubQueue[message.itemName].length;
	}

	/**
	 * Remove a subscribe/unsubscribe request from the queue
	 *
	 * @param {String} itemName the item name
	 * @private
	 */
	function dequeueSubUnsubRequest(itemName) {
		subUnsubQueue[itemName].shift();
	}

	/**
	 * Fire the first event in the queue
	 *
	 * @param {String} itemName the item name
	 * @private
	 */
	function fireFirstSubUnsubEvent(itemName) {
		if (subUnsubQueue[itemName].length > 0) {
			request = subUnsubQueue[itemName][0];
			that.emit(request.message.verb, itemName, request.response);
		}
	}

	/**
	 * Handle late item sub/unsub requests
	 *
	 * @param {String} itemName the item name
	 * @private
	 */
	function handleLateSubUnsubRequests(itemName) {
		var queue = subUnsubQueue[itemName];
		// It expects that the items in the queue
		// are in the following sequence SUSUSU[S]
		// (the function is called after a successful unsub reply)
		while (queue.length > 1) {
			// Send error to the sub request
			var request = queue.shift();
			reply(proto.writeSubscribeException(
				request.message.id, "Subscribe request come too late", "subscription"));
			// Send ok to the unsub request
			request = queue.shift();
			reply(proto.writeUnsubscribe(request.message.id));
		}
	}


	handlers = {
		/**
		 * Handles an initialization request creating a DataResponse Object and
		 * emitting the init event.
		 * If the handler is not defined, just writes an ack response.
		 *
		 * @param {Object} message the incoming request associative array
		 * @private
		 */
		'init' : function(message) {
			startKeepalives(message.keepaliveHint);
			if (that.listeners(message.verb).length) {
				var responseParams = message.initResponseParams;
				delete message.initResponseParams;
				delete message.keepaliveHint;
					// the response parameters and keepalive hint are not meant to be visible to the custom Adapter
				var successHandler = function(msg) {
					reply(proto.writeInit(msg.id, responseParams));
				};
				var errorHandler = function(msg, exceptionMessage, exceptionType) {
					reply(proto.writeInitException(msg.id, exceptionMessage, exceptionType));
				};
				var response = new DataResponse(message, successHandler, errorHandler);
				that.emit("init", message, response);
			} else {
				reply(proto.writeInit(message.id, message.initResponseParams));
			}
		},
		/**
		 * Handles a subscribe request creating a DataResponse Object and
		 * emitting the subscribe event.
		 *
		 * @param {Object} message the incoming request associative array
		 * @private
		 */
		'subscribe' : function(message) {
			// this handler is mandatory
			var response = new DataResponse(message, subscribe, subscribeError);
			if (queueSubUnsubRequest(message, response) === 1) {
				fireFirstSubUnsubEvent(message.itemName);
			} else {
				that.emit("subscribeInQueue", message.itemName); // not public, only for tests
			}
		},
		/**
		 * Handles an unsubscribe request creating a DataResponse Object and
		 * emitting the unsubscribe event.
		 *
		 * @param {Object} message the incoming request associative array
		 * @private
		 */
		'unsubscribe' : function(message) {
			// this handler is mandatory
			var response = new DataResponse(message, unsubscribe, unsubscribeError);
			if (queueSubUnsubRequest(message, response) === 1) {
				fireFirstSubUnsubEvent(message.itemName);
			} else {
				that.emit("unsubscribeInQueue", message.itemName); // not public, only for tests
			}
		}
	};

	/**
	 * Sends an update for a particular item to the remote LS proxy.
	 *
	 * @param {String} itemName the item name
	 * @param {Boolean} isSnapshot is it a snapshot?
	 * @param {Object} data an associative array of strings
	 * that represents the data to be published
	 */
	function update(itemName, isSnapshot, data) {
		var message, id = getIdFromItemName(itemName);
		message = proto.writeUpdate(id, itemName, isSnapshot, data);
		notify(message);
		return that;
	}

	/**
	 * Sends an end of snapshot message for a particular item to the remote LS proxy.
	 *
	 * @param {String} itemName the item name
	 */
	function endOfSnapshot(itemName) {
		var message, id = getIdFromItemName(itemName);
		message = proto.writeEndOfSnapshot(id, itemName);
		notify(message);
		return that;
	}

	/**
	 * Sends a clear snapshot message for a particular item to the remote LS proxy.
	 *
	 * @param {String} itemName the item name
	 */
	function clearSnapshot(itemName) {
		var message, id = getIdFromItemName(itemName);
		message = proto.writeClearSnapshot(id, itemName);
		notify(message);
		return that;
	}

	/**
	 * Sends information about "diff" algorithms for some or all fields
	 * of a particular item. The algorithms suitable for each fields should be expressed
	 * as an array of string literals representing the actual algorithms in the desired order.
	 * Omitted fields or null arrays will add no information. On the other hand, an empty array
	 * can be supplied to mean that no "diff" algorithm is admitted for a field.
	 *
	 * @param {String} itemName the item name
	 * @param {Object} algorithmsMap an associative array of algorithm lists,
	 * in turn expressed as a (possibly empty) array of string literals.
	 * Supported literals are:<ul>
	 * <li>"JSONPATCH": Computes the difference between two values that are valid JSON
	 * string representations in JSON Patch format.</li>
	 * <li>"DIFF_MATCH_PATCH": Computes the difference between two values with Google's
	 * "diff-match-patch" algorithm (the result is then serialized with the custom
	 * "TLCP-diff" format). This algorithm applies to any strings, only provided that
	 * their UTF-16 representation doesn't contain surrogate pairs.</li>
	 * </ul>
	 */
	function declareFieldDiffOrder(itemName, algorithmsMap) {
		var message, id = getIdFromItemName(itemName);
		message = proto.writeFieldDiffOrder(id, itemName, algorithmsMap);
		notify(message);
		return that;
	}

	/**
	 * Sends a failure message to the remote LS proxy.
	 *
	 * @param {String} exception the exception message
	 */
	function failure(exception) {
		var message;
		message = proto.writeFailure(exception);
		notify(message);
		return that;
	}

	/**
	 * Returns a request id for an item name
	 *
	 * @param {String} itemName the item name
	 * @private
	 */
	function getIdFromItemName(itemName) {
		var id = subscritions[itemName];
		if (typeof id === "undefined") {
			throw new Error('Item [' + itemName + '] is not subscribed');
		} else {
			return id;
		}
	}

	/**
	 * Returns the configured notify stream, which should be null, unless an old Proxy Data Adapter is in use.
	 *
	 * @return Object the stream or null 
	 */
	function getNotifyStream() {
		return notifyStream;
	}

	/**
	 * Returns the configured request/reply stream.
	 *
	 * @return Object the stream 
	 */
	function getReqRespStream() {
		return reqRespStream;
	}

	// Public methods
	that = {
		update: update,
		endOfSnapshot: endOfSnapshot,
		clearSnapshot: clearSnapshot,
		declareFieldDiffOrder: declareFieldDiffOrder,
		failure: failure,
		notifyStream: getNotifyStream,
		reqRespStream: getReqRespStream
	};

	// The object extends the standard EventEmitter
	that.__proto__ = EventEmitter.prototype;

	return that;
}

/**
 * <p>DataResponse constructor.
 * An instance of this class is passed as argument to an event listener,
 * and must be used to respond to the remote adapter request,
 * using the success method or the error method.</p>
 *
 * @class
 * Private constructor arguments:
 * {Object} message the request data
 * {Function} successHandler a callback to the DataProvider function for a successful response
 * {Function} errorHandler a callback to the DataProvider function for an error response
 */
function DataResponse(message, successHandler, errorHandler) {

	var isUsed = false;

	/**
	 * Sends a successful response.
	 */
	function success() {
		checkIfUsed();
		successHandler.call(that, message);
	}

	/**
	 * Sends an error response. The optional exception type parameter that can be used
	 * to issue a proper type of exception depends on the event handled as described in the following table:
	 * <ul>
	 * <li>init: "data"</li>
	 * <li>subscribe: "subscription"</li>
	 * <li>unsubscribe: "subscription"</li>
	 * </ul>
	 *
	 * @param {String} exceptionMessage exception message
	 * @param {String} [exceptionType] exception type
	 */
	function error(exceptionMessage, exceptionType) {
		checkIfUsed();
		errorHandler.call(that, message, exceptionMessage, exceptionType);
	}

	function checkIfUsed() {
		if (isUsed){
			throw new Error("Response for request " + message.id + " has been already used");
		} else {
			isUsed = true;
		}		
	}

	// Public methods
	that = {
		error: error,
		success: success
	};


	return that;
}

// Module exports
exports.DataProvider = DataProvider;