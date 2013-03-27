// Module imports
var protocol =  require('./protocol'),
	types = require('./consts').types,
	exceptions = require('./consts').exceptions,
	metadataMethods = require('./consts').metadataMethods;


// Module exports
exports.metadata = {
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
	 * Encodes an unsuccessful get schema reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: items, schema
	 * @return {String} the encoded message
	 * @private
	 */
	writeGetSchemaException : function(requestId, exceptionMessage, exceptionType) {
		return protocol.implodeMessage(requestId, metadataMethods.GET_SCHEMA,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
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
		return protocol.implodeMessage(requestId, metadataMethods.GET_ITEM_DATA,
			exceptions.GENERIC, protocol.encodeString(exceptionMessage));						
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
		return protocol.implodeMessage(requestId, metadataMethods.GET_USER_ITEM_DATA,
			exceptions.GENERIC, protocol.encodeString(exceptionMessage));						
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
		return protocol.implodeMessage(requestId, metadataMethods.GET_ITEMS,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
	},
	/**
	 * Encodes an unsuccessful notify user reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: access, credits
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUserException : function(requestId, exceptionMessage, exceptionType) {
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_USER,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
	},
	/**
	 * Encodes an unsuccessful notify user with SSL reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: access, credits
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUserAuthException : function(requestId, exceptionMessage, exceptionType) {
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_USER_AUTH,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
	},
	/**
	 * Encodes an unsuccessful notify user message reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyUserMessageException : function(requestId, exceptionMessage, exceptionType) {
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_USER_MESSAGE,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
	},
	/**
	 * Encodes an unsuccessful notify new session reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits, conflictingSession
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyNewSessionException : function(requestId, exceptionMessage, exceptionType) {
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_NEW_SESSION,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
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
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_SESSION_CLOSE,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
	},
	/**
	 * Encodes an unsuccessful notify new tables reply.
	 *
	 * @param {String} requestId the originating request id
	 * @param {String} exceptionMessage the exception message
	 * @param {String} [exceptionType] the exception type. Allowed values: notification, credits
	 * @return {String} the encoded message
	 * @private
	 */
	writeNotifyNewTablesException : function(requestId, exceptionMessage, exceptionType) {
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_NEW_TABLES,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
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
		return protocol.implodeMessage(requestId, metadataMethods.NOTIFY_TABLES_CLOSE,
			protocol.encodeMetadataException(exceptionType),
			protocol.encodeString(exceptionMessage));						
	},
};

/**
 * Decodes the message string from the server in an associative array.
 * The data returned has the following general form:
 * {id: REQUEST_ID, verb: METHOD_NAME, ...}.
 *
 * @param {String} request string message from the remote proxy (UTF8)
 * @return {Object} the decoded message
 * @private
 */
 function read(request) {
	var message, tokens, tail;
	tokens = protocol.explode((request + '').replace(/\r*\n$/, ''));
	if (tokens.length < 2) {
		throw new Error('Message has an invalid number of tokens: ' + request);
	}
	message = {
		id : tokens[0],
	};
	tail = tokens.slice(2);
	if (metadataMethods.GET_ITEM_DATA === tokens[1]) {
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
	} else {
		throw new Error('Message has an invalid method: ' + request);			
	}
	return message;
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
	readNotifyUserHeaders(message, tokens.slice(4, -4));
	message.requestId = protocol.decodeString(tokens[tokens.length - 1]);		
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
	readNotifyUserHeaders(message, tokens.slice(6, -4));
	message.requestId = protocol.decodeString(tokens[tokens.length - 1]);		
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
 * Decode the tables info part pf a notify tables request.
 *
 * @param {Object} message the message object partially initialized
 * @param {Array} tokens the table infos part of the message already tokenized
 * @private
 */
function readTableInfos(message, tokens) {
	var tableInfo, i;
	message.tableInfos = [];
	for (i = 0; i < tokens.length; i = i + 14) {
		tableInfo = {};
		tableInfo.winIndex = protocol.decodeInteger(tokens[i + 1]);
		tableInfo.pubModes = protocol.decodePubModes(tokens[i + 3]);
		tableInfo.groupName = protocol.decodeString(tokens[i + 5]);
		tableInfo.schemaName = protocol.decodeString(tokens[i + 7]);
		tableInfo.firstItemIndex = protocol.decodeInteger(tokens[i + 9]);
		tableInfo.lastItemIndex = protocol.decodeInteger(tokens[i + 11]);
		tableInfo.selector = protocol.decodeString(tokens[i + 13]);
		message.tableInfos.push(tableInfo);
	}	
}

exports.MetadataReader = function() {
	return new protocol.StreamReader(read);
}