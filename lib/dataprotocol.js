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

// Module imports
var protocol =  require('./protocol'),
	types = require('./consts').types,
	exceptions = require('./consts').exceptions,
	dataMethods = require('./consts').dataMethods;

// Module exports
exports.data = {
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
	 * @param {String} exception the error message
	 * @return {String} the encoded message
	 * @private
	 */
	writeSubscribeException : function(requestId, exception) {
		return protocol.implodeMessage(requestId, dataMethods.SUBSCRIBE,
    		exceptions.SUBSCRIPTION, protocol.encodeString(exception));			
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
	 * @param {String} exception the error message
	 * @return {String} the encoded message
	 * @private
	 */
	writeUnsubscribeException : function(requestId, exception) {
		return protocol.implodeMessage(requestId, dataMethods.UNSUBSCRIBE,
    		exceptions.SUBSCRIPTION, protocol.encodeString(exception));			
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
 * @return {Object} the decoded message
 * @private
 */
function read(request) {
	var message, tokens;
	tokens = protocol.explode(request);
	if (tokens.length != 4) {
		throw new Error('Message has an invalid number of tokens ' + request);
	}
	message = {
		id : tokens[0],
		itemName : protocol.decodeString(tokens[3])
	};
	if (dataMethods.SUBSCRIBE === tokens[1]) {
		message.verb = 'subscribe';
	} else if (dataMethods.UNSUBSCRIBE === tokens[1]) {
		message.verb = 'unsubscribe';
	} else {
		throw new Error('Message has an invalid method');			
	}
	return message;
}

exports.DataReader = function() {
	return new protocol.StreamReader(read);
}