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
var protocol =  require('./protocol');
var baseProtocol =  require('./baseprotocol');
var types = require('./consts').types;
var exceptions = require('./consts').exceptions;
var dataMethods = require('./consts').dataMethods;
var commonMethods = require('./consts').commonMethods;
var specialRequestIDs = require('./consts').specialRequestIDs;

// Module exports
exports.data = {
	/**
	 * Encodes a successful initialization reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {Object} parameters the response name-value pairs
	 * @return {String} the encoded message
	 * @private
	 */
	writeInit : function(requestId, parameters) {
		if (parameters != null) {
			return protocol.implodeMessage(requestId,
				dataMethods.DATA_INIT,
				protocol.implodeDataOld(parameters));
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
				exceptions.DATA, protocol.encodeStringOld(exceptionMessage));
		} else {
			return protocol.implodeMessage(requestId, dataMethods.DATA_INIT,
				exceptions.GENERIC, protocol.encodeStringOld(exceptionMessage));
		}
	},
	/**
	 * Encodes a credentials unsolicited reply.
	 *
	 * @param {Object} parameters the credentials name-value pairs
	 * @return {String} the encoded message
	 * @private
	 */
	writeRemoteCredentials : function(parameters) {
		var virtualRequestId = specialRequestIDs.AUTH_REQUEST_ID;
		return protocol.implodeMessage(virtualRequestId,
			commonMethods.REMOTE_CREDENTIALS,
			protocol.implodeDataOld(parameters));
	},
	/**
	 * Encodes a keepalive packet.
	 *
	 * @return {String} the encoded packet
	 * @private
	 */
	writeKeepalive : function() {
		return protocol.implodeMessage(commonMethods.KEEPALIVE);
	},
	/**
	 * Encodes a notification stream credentials message.
	 *
	 * @param {Object} parameters the credentials name-value pairs
	 * @return {String} the encoded message
	 * @private
	 */
	writeRemoteCredentialsOnNotif : function(parameters) {
		return protocol.implodeMessage(protocol.timestamp(),
			commonMethods.REMOTE_CREDENTIALS,
			protocol.implodeDataOld(parameters));
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
	},
	/**
	 * Encodes field "diff" algorithm order information for a particular item to be sent to the proxy.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} itemName the item name
	 * @param {Object} algorithmsMap a flat associative array that represents the ordered lists
	 * of field's "diff" algorithms
	 * @return {String} the encoded message
	 * @private
	 */
	writeFieldDiffOrder : function(requestId, itemName, algorithmsMap) {
		return protocol.implodeMessage(protocol.timestamp(), dataMethods.DECLARE_FIELD_DIFF_ORDER,
			types.STRING, protocol.encodeString(itemName),
			types.STRING, requestId,
			protocol.implodeFieldDiffOrder(algorithmsMap));
	}
};

/**
 * Decodes the message string from the server in an associative array.
 * The data returned has the following form:
 * {id: REQUEST_ID, verb: METHOD_NAME(subscribe|unsubscribe), itemName: ITEM_NAME}.
 *
 * @param {String} request the string message received from the remote proxy
 * @param {Boolean} initPending if we are waiting for the initial "init" message
 * @return {Object} the decoded message
 * @private
 */
function read(request, initPending) {
	var message, tokens;
	tokens = protocol.explode(request);
	if (tokens.length < 2) {
		throw new Error('Message has an invalid number of tokens: ' + request);
	}
	message = {
		id : tokens[0],
	};

	var isInitRequest = (dataMethods.DATA_INIT === tokens[1]);
	var isCloseRequest = (commonMethods.CLOSE === tokens[1]);

	if (isCloseRequest) {
		// this can also precede the init request
		if (message.id != specialRequestIDs.CLOSE_REQUEST_ID) {
			throw new Error("Unexpected id found while parsing a " + commonMethods.METHOD_CLOSE + " message");
		}
	} else {
		if (! initPending && isInitRequest) {
			throw new Error("Unexpected late " + dataMethods.DATA_INIT + " message");
		} else if (initPending && ! isInitRequest) {
			throw new Error("Unexpected message " + request + " while waiting for a " + dataMethods.DATA_INIT + " message");
		}
	}

	if (isInitRequest) {
		var tail = tokens.slice(2);
		message.verb = "init";
		readInit(message, tail);
	} else if (isCloseRequest) {
		var tail = tokens.slice(2);
		message.verb = "close";
		readClose(message, tail);
	} else if (dataMethods.SUBSCRIBE === tokens[1]) {
		if (tokens.length != 4) {
			throw new Error('Message has an invalid number of tokens ' + request);
		}
		message.verb = 'subscribe';
		message.itemName = protocol.decodeString(tokens[3]);
	} else if (dataMethods.UNSUBSCRIBE === tokens[1]) {
		if (tokens.length != 4) {
			throw new Error('Message has an invalid number of tokens ' + request);
		}
		message.verb = 'unsubscribe';
		message.itemName = protocol.decodeString(tokens[3]);
	} else {
		throw new Error('Message has an invalid method: ' + request);
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
	return baseProtocol.readInitParameters(message, tokens);
}

/**
 * Decode a close message.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readClose(message, tokens) {
	return baseProtocol.readCloseParameters(message, tokens);
}


exports.DataReader = function() {
	return new protocol.StreamReader(read);
}