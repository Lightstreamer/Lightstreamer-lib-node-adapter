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

// Module imports
var protocol =  require('./protocol'),
	types = require('./consts').types,
	exceptions = require('./consts').exceptions,
	dataMethods = require('./consts').dataMethods,
	specialParameters = require('./consts').specialParameters;

function acceptProtocol(protocolVersion) {
	if (protocolVersion != null) {
		// regardless of the protocol version requested, we want to speak 1.8.1
		// the proxy adapter should decide whether or not to accept
		var initResponseParams = {};
		initResponseParams[specialParameters.ARI_VERSION] = "1.8.1";
		return initResponseParams;
	} else {
		// 1.8.0 still supported,
		// the only difference is that there is no response to init
		// and there is no notification stream init
		return null;
	}
}

// Module exports
exports.data = {
	/**
	 * Encodes a successful initialization reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {Object} parameters the response name-value pairs (since 1.8.1)
	 * @return {String} the encoded message
	 * @private
	 */
	writeInit : function(requestId, parameters) {
		if (parameters != null) {
			return protocol.implodeMessage(requestId,
				dataMethods.DATA_INIT,
				protocol.implodeData(parameters));
		} else {
			return protocol.implodeMessage(requestId,
				dataMethods.DATA_INIT, types.VOID);
		}
	},
	/**
	 * Encodes an unsuccessful initialization reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: data
	 * @return {String} the encoded message
	 * @private
	 */
	writeInitException : function(requestId, exceptionMessage, exceptionType) {
		if (exceptionType === "data") {
			return protocol.implodeMessage(requestId, dataMethods.DATA_INIT,
				exceptions.DATA, protocol.encodeString(exceptionMessage));
		} else {
			return protocol.implodeMessage(requestId, dataMethods.DATA_INIT,
				exceptions.GENERIC, protocol.encodeString(exceptionMessage));
		}
	},
	/**
	 * Encodes a notification stream initialization message (since 1.8.1).
	 *
	 * @param {Object} parameters the message name-value pairs
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifInit : function(parameters) {
		return protocol.implodeMessage(protocol.timestamp(),
			dataMethods.DATA_NOTIF_INIT,
			protocol.implodeData(parameters));
	},
	/**
	 * Encodes a successful subscribe reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeSubscribe : function(requestId) {
		return protocol.implodeMessage(requestId, dataMethods.SUBSCRIBE, types.VOID);
	},
	/**
	 * Encodes an unsuccessful subscribe reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: subscription
	 * @return {String} the encoded message
	 * @private
	 */
	writeSubscribeException : function(requestId, exceptionMessage, exceptionType) {
		if (exceptionType === "subscription") {
			return protocol.implodeMessage(requestId, dataMethods.SUBSCRIBE,
				exceptions.SUBSCRIPTION, protocol.encodeString(exceptionMessage));
		} else {
			return protocol.implodeMessage(requestId, dataMethods.SUBSCRIBE,
				exceptions.GENERIC, protocol.encodeString(exceptionMessage));
		}
	},
	/**
	 * Encodes a successful unsubscribe reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeUnsubscribe : function(requestId) {
		return protocol.implodeMessage(requestId, dataMethods.UNSUBSCRIBE, types.VOID);
	},
	/**
	 * Encodes an unsuccessful unsubscribe reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: subscription
	 * @return {String} the encoded message
	 * @private
	 */
	writeUnsubscribeException : function(requestId, exceptionMessage, exceptionType) {
		if (exceptionType === "subscription") {
			return protocol.implodeMessage(requestId, dataMethods.UNSUBSCRIBE,
				exceptions.SUBSCRIPTION, protocol.encodeString(exceptionMessage));
		} else {
			return protocol.implodeMessage(requestId, dataMethods.UNSUBSCRIBE,
				exceptions.GENERIC, protocol.encodeString(exceptionMessage));
		}
	},
	/**
	 * Encodes an failure message to be sent to the proxy.
	 *
	 * @param {String} exception error message
	 * @return {String} the encoded message
	 * @private
	 */
	writeFailure : function(exception){
		return protocol.implodeMessage(protocol.timestamp(), dataMethods.FAILURE,
			exceptions.GENERIC, protocol.encodeString(exception));
	},
	/**
	 * Encodes an end of snapshot message for a particular item to be sent to the proxy.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} itemName the item name
	 * @return {String} the encoded message
	 * @private
	 */
	writeEndOfSnapshot : function(requestId, itemName) {
		return protocol.implodeMessage(protocol.timestamp(), dataMethods.END_OF_SNAPSHOT,
			types.STRING, protocol.encodeString(itemName),
			types.STRING, requestId);
	},
	/**
	 * Encodes a clear snapshot message for a particular item to be sent to the proxy.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} itemName the item name
	 * @return {String} the encoded message
	 * @private
	 */
	writeClearSnapshot : function(requestId, itemName) {
		return protocol.implodeMessage(protocol.timestamp(), dataMethods.CLEAR_SNAPSHOT,
			types.STRING, protocol.encodeString(itemName),
		types.STRING, requestId);
	},
	/**
	 * Encodes an update for a particular item to be sent to the proxy.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} itemName the item name
	 * @param {Boolean} isSnapshot if the data is a complete snapshot
	 * @param {Object} data a flat associative array built using simple primitive data
	 * types that represents the update record
	 * @return {String} the encoded message
	 * @private
	 */
	writeUpdate : function(requestId, itemName, isSnapshot, data) {
		return protocol.implodeMessage(protocol.timestamp(), dataMethods.UPDATE_BY_MAP,
			types.STRING, protocol.encodeString(itemName),
			types.STRING, requestId,
			types.BOOLEAN, protocol.encodeBoolean(isSnapshot),
			protocol.implodeData(data));
	}
};

/**
 * Decodes the message string from the server in an associative array.
 * The data returned has the following form:
 * {id: REQUEST_ID, verb: METHOD_NAME(subscribe|unsubscribe), itemName: ITEM_NAME}.
 *
 * @param {String} request the string message received from the remote proxy
 * @param {Boolean} initExpected if we are waiting for the initial "init" message
 * @return {Object} the decoded message
 * @private
 */
function read(request, initExpected) {
	var message, tokens;
	tokens = protocol.explode(request);
	if (tokens.length < 2) {
		throw new Error('Message has an invalid number of tokens: ' + request);
	}
	message = {
		id : tokens[0],
	};

	var isInitRequest = (dataMethods.DATA_INIT === tokens[1]);
	if (! initExpected && isInitRequest) {
		throw new Error("Unexpected late " + dataMethods.DATA_INIT + " message");
	} else if (initExpected && ! isInitRequest) {
		throw new Error("Unexpected message " + request + " while waiting for a " + dataMethods.DATA_INIT + " message");
	}
	if (! isInitRequest && tokens.length != 4) {
		throw new Error('Message has an invalid number of tokens ' + request);
	}

	if (isInitRequest) {
		var tail = tokens.slice(2);
		message.verb = "init";
		readInit(message, tail);
	} else if (dataMethods.SUBSCRIBE === tokens[1]) {
		message.verb = 'subscribe';
		message.itemName = protocol.decodeString(tokens[3]);
	} else if (dataMethods.UNSUBSCRIBE === tokens[1]) {
		message.verb = 'unsubscribe';
		message.itemName = protocol.decodeString(tokens[3]);
	} else {
		throw new Error('Message has an invalid method');
	}
	return message;
}

/**
 * Decode a init request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readInit(message, tokens) {
	var i;
	message.parameters = {};
	for (i = 0; i < tokens.length; i = i + 4) {
		if (specialParameters.ARI_VERSION === protocol.decodeString(tokens[i + 1])) {
			message.initResponseParams = acceptProtocol(protocol.decodeString(tokens[i + 3]));
			// the version is an internal parameter, not to be sent to the custom Adapter
		} else {
			message.parameters[protocol.decodeString(tokens[i + 1])] = protocol.decodeString(tokens[i + 3]);
		}
	}
}


exports.DataReader = function() {
	return new protocol.StreamReader(read);
}