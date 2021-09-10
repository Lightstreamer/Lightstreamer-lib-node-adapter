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
var metadataMethods = require('./consts').metadataMethods;
var commonMethods = require('./consts').commonMethods;
var specialRequestIDs = require('./consts').specialRequestIDs;

// Module exports
exports.metadata = {
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
				metadataMethods.METADATA_INIT,
				protocol.implodeData(parameters));
		} else {
			return protocol.implodeMessage(requestId,
				metadataMethods.METADATA_INIT, types.VOID);
		}
	},
	/**
	 * Encodes a credentials unsolicited reply (since 1.8.2).
	 *
	 * @param {Object} parameters the credentials name-value pairs
	 * @return {String} the encoded message
	 * @private
	 */
	writeRemoteCredentials : function(parameters) {
		var virtualRequestId = specialRequestIDs.AUTH_REQUEST_ID;
		return protocol.implodeMessage(virtualRequestId,
			commonMethods.REMOTE_CREDENTIALS,
			protocol.implodeData(parameters));
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
	 * Encodes a successful get schema reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {Array} fieldNames an array of field name strings
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetSchema : function(requestId, fieldNames) {
		return protocol.implodeMessage(requestId,
			metadataMethods.GET_SCHEMA,
			protocol.implodeDataArray(fieldNames));
	},
	/**
	 * Encodes a successful get items reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {Array} itemNames an array of item name strings
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetItems : function(requestId, itemNames) {
		return protocol.implodeMessage(requestId,
			metadataMethods.GET_ITEMS,
			protocol.implodeDataArray(itemNames));
	},
	/**
	 * Encodes a successful get item data reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {Array} itemData an array of objects with the following structure:
	 * {distinctSnapLen: INTEGER, minSourceFreq: DOUBLE,
	 *   allowedModes: {raw: BOOL, merge: BOOL, distinct: BOOL, command: BOOL}}
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetItemData : function(requestId, itemData) {
		var i, payload = [], item;
		for (i = 0; i < itemData.length; i = i + 1) {
			payload.push(types.INT);
			payload.push(protocol.encodeInteger(itemData[i].distinctSnapLen));
			payload.push(types.DOUBLE);
			payload.push(protocol.encodeDouble(itemData[i].minSourceFreq));
			payload.push(types.MODE);
			payload.push(protocol.encodePubModes(itemData[i].allowedModes));
		}
		return protocol.implodeMessage(requestId, metadataMethods.GET_ITEM_DATA,
			protocol.implodeArray(payload));
	},
	/**
	 * Encodes a successful get user item data reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {Array} userItemData an array of objects with the following structure:
	 * {allowedBufferSize: INTEGER, allowedMaxItemFreq: DOUBLE,
	 *   allowedModes: {raw: BOOL, merge: BOOL, distinct: BOOL, command: BOOL}}
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetUserItemData : function(requestId, userItemData) {
		var i, payload = [], item;
		for (i = 0; i < userItemData.length; i = i + 1) {
			payload.push(types.INT);
			payload.push(protocol.encodeInteger(userItemData[i].allowedBufferSize));
			payload.push(types.DOUBLE);
			payload.push(protocol.encodeDouble(userItemData[i].allowedMaxItemFreq));
			payload.push(types.MODE);
			payload.push(protocol.encodePubModes(userItemData[i].allowedModes));
		}
		return protocol.implodeMessage(requestId, metadataMethods.GET_USER_ITEM_DATA,
			protocol.implodeArray(payload));
	},
	/**
	 * Encodes a successful notify user reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {Number} maxBandwidth the max bandwidth for the user
	 * @param {Boolean} notifyTables if the user wants to be notified about tables
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUser : function(requestId, maxBandwidth, notifyTables) {
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_USER,
			types.DOUBLE, protocol.encodeDouble(maxBandwidth),
			types.BOOLEAN, protocol.encodeBoolean(notifyTables));
	},
	/**
	 * Encodes a successful notify user with SSL reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {Number} maxBandwidth the max bandwidth for the user
	 * @param {Boolean} notifyTables if the user wants to be notified about tables
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUserAuth : function(requestId, maxBandwidth, notifyTables) {
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_USER_AUTH,
			types.DOUBLE, protocol.encodeDouble(maxBandwidth),
			types.BOOLEAN, protocol.encodeBoolean(notifyTables));
	},
	/**
	 * Encodes a successful notify user reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUserMessage : function(requestId) {
		return protocol.implodeMessage(requestId,
			metadataMethods.NOTIFY_USER_MESSAGE, types.VOID);
	},
	/**
	 * Encodes a successful notify new session reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyNewSession : function(requestId) {
		return protocol.implodeMessage(requestId,
			metadataMethods.NOTIFY_NEW_SESSION, types.VOID);
	},
	/**
	 * Encodes a successful notify session close reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifySessionClose : function(requestId) {
		return protocol.implodeMessage(requestId,
			metadataMethods.NOTIFY_SESSION_CLOSE, types.VOID);
	},
	/**
	 * Encodes a successful notify new tables reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyNewTables : function(requestId) {
		return protocol.implodeMessage(requestId,
			metadataMethods.NOTIFY_NEW_TABLES, types.VOID);
	},
	/**
	 * Encodes a successful notify tables close reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyTablesClose : function(requestId) {
		return protocol.implodeMessage(requestId,
			metadataMethods.NOTIFY_TABLES_CLOSE, types.VOID);
	},
	/**
	 * Encodes a successful notify MPN device access reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyMpnDeviceAccess : function(requestId) {
		return protocol.implodeMessage(requestId,
			metadataMethods.NOTIFY_MPN_DEVICE_ACCESS, types.VOID);
	},
	/**
	 * Encodes a successful notify MPN subscription activation reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyMpnSubscriptionActivation : function(requestId) {
		return protocol.implodeMessage(requestId,
			metadataMethods.NOTIFY_MPN_SUBSCRIPTION_ACTIVATION, types.VOID);
	},
	/**
	 * Encodes a successful notify MPN device token change reply.
	 *
	 * @param {String} requestId the originating request id
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyMpnDeviceTokenChange : function(requestId) {
		return protocol.implodeMessage(requestId,
			metadataMethods.NOTIFY_MPN_DEVICE_TOKEN_CHANGE, types.VOID);
	},
	/**
	 * Encodes an unsuccessful initialization reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: metadata
	 * @return {String} the encoded message
	 * @private
	 */
	writeInitException : function(requestId, exceptionMessage, exceptionType) {
		return writeSimpleException(requestId, metadataMethods.METADATA_INIT, exceptionMessage, exceptionType);
	},
	/**
	 * Encodes an unsuccessful get schema reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: items, schema
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetSchemaException : function(requestId, exceptionMessage, exceptionType) {
		return writeSimpleException(requestId, metadataMethods.GET_SCHEMA, exceptionMessage, exceptionType);
	},
	/**
	 * Encodes an unsuccessful get item data reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetItemDataException : function(requestId, exceptionMessage) {
		return writeDefaultException(requestId, metadataMethods.GET_ITEM_DATA, exceptionMessage);
	},
	/**
	 * Encodes an unsuccessful get user item data reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetUserItemDataException : function(requestId, exceptionMessage) {
		return writeDefaultException(requestId, metadataMethods.GET_USER_ITEM_DATA, exceptionMessage);
	},
	/**
	 * Encodes an unsuccessful get items reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: items
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetItemsException : function(requestId, exceptionMessage, exceptionType) {
		return writeSimpleException(requestId, metadataMethods.GET_ITEMS, exceptionMessage, exceptionType);
	},
	/**
	 * Encodes an unsuccessful notify user reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: access, credits
	 * @param {Object} [exceptionData] extra information which depends on the exception type
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUserException : function(requestId, exceptionMessage, exceptionType, exceptionData) {
		return writeExtendedException(requestId, metadataMethods.NOTIFY_USER, exceptionMessage, exceptionType, exceptionData);
	},
	/**
	 * Encodes an unsuccessful notify user with SSL reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: access, credits
	 * @param {Object} [exceptionData] extra information which depends on the exception type
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUserAuthException : function(requestId, exceptionMessage, exceptionType, exceptionData) {
		return writeExtendedException(requestId, metadataMethods.NOTIFY_USER_AUTH, exceptionMessage, exceptionType, exceptionData);
	},
	/**
	 * Encodes an unsuccessful notify user message reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits
	 * @param {Object} [exceptionData] extra information which depends on the exception type
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUserMessageException : function(requestId, exceptionMessage, exceptionType, exceptionData) {
		return writeExtendedException(requestId, metadataMethods.NOTIFY_USER_MESSAGE, exceptionMessage, exceptionType, exceptionData);
	},
	/**
	 * Encodes an unsuccessful notify new session reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits, conflictingSession
	 * @param {Object} [exceptionData] extra information which depends on the exception type
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyNewSessionException : function(requestId, exceptionMessage, exceptionType, exceptionData) {
		return writeExtendedException(requestId, metadataMethods.NOTIFY_NEW_SESSION, exceptionMessage, exceptionType, exceptionData);
	},
	/**
	 * Encodes an unsuccessful notify session close reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifySessionCloseException : function(requestId, exceptionMessage, exceptionType) {
		return writeSimpleException(requestId, metadataMethods.NOTIFY_SESSION_CLOSE, exceptionMessage, exceptionType);
	},
	/**
	 * Encodes an unsuccessful notify new tables reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits
	 * @param {Object} [exceptionData] extra information which depends on the exception type
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyNewTablesException : function(requestId, exceptionMessage, exceptionType, exceptionData) {
		return writeExtendedException(requestId, metadataMethods.NOTIFY_NEW_TABLES, exceptionMessage, exceptionType, exceptionData);
	},
	/**
	 * Encodes an unsuccessful notify tables close reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyTablesCloseException : function(requestId, exceptionMessage, exceptionType) {
		return writeSimpleException(requestId, metadataMethods.NOTIFY_TABLES_CLOSE, exceptionMessage, exceptionType);
	},
	/**
	 * Encodes an unsuccessful MPN device access reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits
	 * @param {Object} [exceptionData] extra information which depends on the exception type
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyMpnDeviceAccessException : function(requestId, exceptionMessage, exceptionType, exceptionData) {
		return writeExtendedException(requestId, metadataMethods.NOTIFY_MPN_DEVICE_ACCESS, exceptionMessage, exceptionType, exceptionData);
	},
	/**
	 * Encodes an unsuccessful MPN subscription activation reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits
	 * @param {Object} [exceptionData] extra information which depends on the exception type
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyMpnSubscriptionActivationException : function(requestId, exceptionMessage, exceptionType, exceptionData) {
		return writeExtendedException(requestId, metadataMethods.NOTIFY_MPN_SUBSCRIPTION_ACTIVATION, exceptionMessage, exceptionType, exceptionData);
	},
	/**
	 * Encodes an unsuccessful MPN device token change reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits
	 * @param {Object} [exceptionData] extra information which depends on the exception type
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyMpnDeviceTokenChangeException : function(requestId, exceptionMessage, exceptionType, exceptionData) {
		return writeExtendedException(requestId, metadataMethods.NOTIFY_MPN_DEVICE_TOKEN_CHANGE, exceptionMessage, exceptionType, exceptionData);
	},
};

/**
 * Encodes an unsuccessful reply of an unspecified type.
 *
 * @param {String} requestId the originating request id
 * @param {String} requestType the originating request method name
 * @param {String} exceptionMessage the exception message
 * @return {String} the encoded message
 * @private
 */
function writeDefaultException(requestId, requestType, exceptionMessage) {
	return protocol.implodeMessage(requestId, requestType,
		exceptions.GENERIC,
		protocol.encodeString(exceptionMessage));
}

/**
 * Encodes an unsuccessful reply.
 *
 * @param {String} requestId the originating request id
 * @param {String} requestType the originating request method name
 * @param {String} exceptionMessage the exception message
 * @param {String} [exceptionType] the exception type. Allowed values: access, credits
 * @return {String} the encoded message
 * @private
 */
function writeSimpleException(requestId, requestType, exceptionMessage, exceptionType) {
	return protocol.implodeMessage(requestId, requestType,
		protocol.encodeMetadataException(exceptionType),
		protocol.encodeString(exceptionMessage));
}

/**
 * Encodes an unsuccessful reply that may involve an exception with parameters.
 *
 * @param {String} requestId the originating request id
 * @param {String} requestType the originating request method name
 * @param {String} exceptionMessage the exception message
 * @param {String} [exceptionType] the exception type. Allowed values: access, credits
 * @param {Object} [exceptionData] extra information which depends on the exception type
 * @return {String} the encoded message
 * @private
 */
function writeExtendedException(requestId, requestType, exceptionMessage, exceptionType, exceptionData) {
	var encodedExc = protocol.encodeMetadataException(exceptionType);
	if (encodedExc == exceptions.CREDITS) {
		return protocol.implodeMessage(requestId, requestType, encodedExc,
			protocol.encodeString(exceptionMessage),
			protocol.encodeString(exceptionData.clientCode),
			protocol.encodeString(exceptionData.clientMessage));
	} else if (encodedExc === exceptions.CONFLICTING_SESSION) {
		return protocol.implodeMessage(requestId, requestType, encodedExc,
			protocol.encodeString(exceptionMessage),
			protocol.encodeString(exceptionData.clientCode),
			protocol.encodeString(exceptionData.clientMessage),
			protocol.encodeString(exceptionData.conflictingSessionId));
	} else {
		return protocol.implodeMessage(requestId, requestType, encodedExc,
			protocol.encodeString(exceptionMessage));
	}
}

/**
 * Decodes the message string from the server in an associative array.
 * The data returned has the following general form:
 * {id: REQUEST_ID, verb: METHOD_NAME, ...}.
 *
 * @param {String} request string message from the remote proxy (UTF8)
 * @param {Boolean} initPending if we are waiting for the initial "init" message
 * @param {Boolean} closePossible if we support a possible final "close" message
 * @return {Object} the decoded message
 * @private
 */
function read(request, initPending, closePossible) {
	var message, tokens, tail;
	tokens = protocol.explode((request + '').replace(/\r*\n$/, ''));
	if (tokens.length < 2) {
		throw new Error('Message has an invalid number of tokens: ' + request);
	}
	message = {
		id : tokens[0],
	};
	tail = tokens.slice(2);

	var isInitRequest = (metadataMethods.METADATA_INIT === tokens[1]);
	var isCloseRequest = (commonMethods.CLOSE === tokens[1] && closePossible);

	if (isCloseRequest) {
		// this can also precede the init request
		if (message.id != specialRequestIDs.CLOSE_REQUEST_ID) {
			throw new Error("Unexpected id found while parsing a " + commonMethods.METHOD_CLOSE + " message");
		}
	} else {
		if (! initPending && isInitRequest) {
			throw new Error("Unexpected late " + metadataMethods.METADATA_INIT + " message");
		} else if (initPending && ! isInitRequest) {
			throw new Error("Unexpected message " + request + " while waiting for a " + metadataMethods.METADATA_INIT + " message");
		}
	}

	if (isInitRequest) {
		message.verb = "init";
		readInit(message, tail);
	} else if (isCloseRequest) {
		message.verb = "close";
		readClose(message, tail);
	} else if (metadataMethods.GET_ITEM_DATA === tokens[1]) {
		message.verb = "getItemData";
		readGetItemData(message, tail);
	} else if (metadataMethods.NOTIFY_USER === tokens[1]) {
		message.verb = "notifyUser";
		readNotifyUser(message, tail);
	} else if (metadataMethods.NOTIFY_USER_AUTH === tokens[1]) {
		message.verb = "notifyUserAuth";
		readNotifyUserAuth(message, tail);
	} else if (metadataMethods.GET_SCHEMA === tokens[1]) {
		message.verb = "getSchema";
		readGetSchema(message, tail);
	} else if (metadataMethods.GET_ITEMS === tokens[1]) {
		message.verb = "getItems";
		readGetItems(message, tail);
	} else if (metadataMethods.GET_USER_ITEM_DATA === tokens[1]) {
		message.verb = "getUserItemData";
		readGetUserItemData(message, tail);
	} else if (metadataMethods.NOTIFY_USER_MESSAGE === tokens[1]) {
		message.verb = "notifyUserMessage";
		readNotifyUserMessage(message, tail);
	} else if (metadataMethods.NOTIFY_NEW_SESSION === tokens[1]) {
		message.verb = "notifyNewSession";
		readNotifyNewSession(message, tail);
	} else if (metadataMethods.NOTIFY_SESSION_CLOSE === tokens[1]) {
		message.verb = "notifySessionClose";
		readNotifySessionClose(message, tail);
	} else if (metadataMethods.NOTIFY_NEW_TABLES === tokens[1]) {
		message.verb = "notifyNewTables";
		readNotifyNewTables(message, tail);
	} else if (metadataMethods.NOTIFY_TABLES_CLOSE === tokens[1]) {
		message.verb = "notifyTablesClose";
		readNotifyTablesClose(message, tail);
	} else if (metadataMethods.NOTIFY_MPN_DEVICE_ACCESS === tokens[1]) {
		message.verb = "notifyMpnDeviceAccess";
		readNotifyMpnDeviceAccess(message, tail);
	} else if (metadataMethods.NOTIFY_MPN_SUBSCRIPTION_ACTIVATION === tokens[1]) {
		message.verb = "notifyMpnSubscriptionActivation";
		readNotifyMpnSubscriptionActivation(message, tail);
	} else if (metadataMethods.NOTIFY_MPN_DEVICE_TOKEN_CHANGE === tokens[1]) {
		message.verb = "notifyMpnDeviceTokenChange";
		readNotifyMpnDeviceTokenChange(message, tail);
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


/**
 * Decode an get schema request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readGetSchema(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.groupName = protocol.decodeString(tokens[3]);
	message.schemaName = protocol.decodeString(tokens[5]);
	message.sessionId = protocol.decodeString(tokens[7]);
}

/**
 * Decode a get items request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readGetItems(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.groupName = protocol.decodeString(tokens[3]);
	message.sessionId = protocol.decodeString(tokens[5]);
}

/**
 * Decode a get items request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readGetUserItemData(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	readGetItemData(message, tokens.slice(2));
}

/**
 * Decode a get item data request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readGetItemData(message, tokens) {
	message.itemNames = [];
	for (var i = 0; i < tokens.length; i = i + 2) {
		message.itemNames.push(protocol.decodeString(tokens[i + 1]));
	}
}

/**
 * Decode a notify user request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyUser(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.userPassword = protocol.decodeString(tokens[3]);
	readNotifyUserHeaders(message, tokens.slice(4));
}


/**
 * Decode a notify user request with SSL auth.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyUserAuth(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.userPassword = protocol.decodeString(tokens[3]);
	message.clientPrincipal = protocol.decodeString(tokens[5]);
	readNotifyUserHeaders(message, tokens.slice(6));
}

/**
 * Decode the headers of a notify user request.
 *
 * @param {Object} message the message object partially initialized
 * @param {Array} tokens the rest of the headers part of the message already tokenized
 * @private
 */
function readNotifyUserHeaders(message, tokens) {
	var i;
	message.headers = {};
	for (i = 0; i < tokens.length; i = i + 4) {
		message.headers[protocol.decodeString(tokens[i + 1])] = protocol.decodeString(tokens[i + 3]);
	}
}

/**
 * Decode a notify user message request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyUserMessage(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.sessionId = protocol.decodeString(tokens[3]);
	message.userMessage = protocol.decodeString(tokens[5]);
}

/**
 * Decode a notify new session request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyNewSession(message, tokens) {
	var i;
	message.userName = protocol.decodeString(tokens[1]);
	message.sessionId = protocol.decodeString(tokens[3]);
	message.contextProperties = {};
	tokens = tokens.slice(4);
	for (i = 0; i < tokens.length; i = i + 4) {
		message.contextProperties[protocol.decodeString(tokens[i + 1])] = protocol.decodeString(tokens[i + 3]);
	}
}

/**
 * Decode a notify session close request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifySessionClose(message, tokens) {
	message.sessionId = protocol.decodeString(tokens[1]);
}

/**
 * Decode a notify new tables request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyNewTables(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.sessionId = protocol.decodeString(tokens[3]);
	readTableInfos(message, tokens.slice(4));
}

/**
 * Decode a notify tables close request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyTablesClose(message, tokens) {
	message.sessionId = protocol.decodeString(tokens[1]);
	readTableInfos(message, tokens.slice(2));
}

/**
 * Decode a notify MPN device access request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyMpnDeviceAccess(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.sessionId = protocol.decodeString(tokens[3]);
	message.device = {};
	message.device.mpnPlatformType = protocol.decodeString(tokens[5]);
	message.device.applicationId = protocol.decodeString(tokens[7]);
	message.device.deviceToken = protocol.decodeString(tokens[9]);
}

/**
 * Decode a notify MPN subscription activation request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyMpnSubscriptionActivation(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.sessionId = protocol.decodeString(tokens[3]);
	message.tableInfo = readTableInfo(tokens.slice(4), true);
	var base = 16;

	message.mpnSubscription = {};
	message.mpnSubscription.device = {};

	message.mpnSubscription.device.mpnPlatformType = protocol.decodeString(tokens[base + 1]);
	message.mpnSubscription.device.applicationId = protocol.decodeString(tokens[base + 3]);
	message.mpnSubscription.device.deviceToken = protocol.decodeString(tokens[base + 5]);
	message.mpnSubscription.trigger = protocol.decodeString(tokens[base + 7]);
	message.mpnSubscription.notificationFormat = protocol.decodeString(tokens[base + 9]);
}

/**
 * Decode a notify MPN device token change request.
 *
 * @param {Object} message the message object partially initialized with the id and the verb
 * @param {Array} tokens the rest of the message already tokenized
 * @private
 */
function readNotifyMpnDeviceTokenChange(message, tokens) {
	message.userName = protocol.decodeString(tokens[1]);
	message.sessionId = protocol.decodeString(tokens[3]);
	message.device = {};
	message.device.mpnPlatformType = protocol.decodeString(tokens[5]);
	message.device.applicationId = protocol.decodeString(tokens[7]);
	message.device.deviceToken = protocol.decodeString(tokens[9]);
	message.newDeviceToken = protocol.decodeString(tokens[11]);
}

/**
 * Decode the tables info part of a notify tables request.
 *
 * @param {Object} message the message object partially initialized
 * @param {Array} tokens the table infos part of the message already tokenized
 * @private
 */
function readTableInfos(message, tokens) {
	var tableInfo, i;
	message.tableInfos = [];
	while (tokens.length >= 14) {
		tableInfo = readTableInfo(tokens);
		message.tableInfos.push(tableInfo);
		tokens = tokens.slice(14);
	}
}

/**
 * Decode a table info part of a notify tables or notify MPN subscription request.
 *
 * @param {Array} tokens the table info part of the message already tokenized
 * @return {Object} the decoded table info
 * @private
 */
function readTableInfo(tokens, skipSelector) {
	var tableInfo = {};
	tableInfo.winIndex = protocol.decodeInteger(tokens[1]);
	tableInfo.pubModes = protocol.decodePubModes(tokens[3]);
	tableInfo.groupName = protocol.decodeString(tokens[5]);
	tableInfo.schemaName = protocol.decodeString(tokens[7]);
	tableInfo.firstItemIndex = protocol.decodeInteger(tokens[9]);
	tableInfo.lastItemIndex = protocol.decodeInteger(tokens[11]);
	if (!skipSelector)
		tableInfo.selector = protocol.decodeString(tokens[13]);
	return tableInfo;
}

exports.MetadataReader = function() {
	return new protocol.StreamReader(read);
}