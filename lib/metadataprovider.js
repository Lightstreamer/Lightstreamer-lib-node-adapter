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
 * @module lightstreamer-adapter/metadataprovider
 */

// Module imports
var EventEmitter = require('events').EventEmitter,
	proto = require('./metadataprotocol').metadata,
	MetadataReader = require('./metadataprotocol').MetadataReader;

/**
 * Metadata provider constructor.<br>
 * The created object allows you to interact with Lightstreamer Server through
 * the Adapter Remoting Infrastructure protocol as a Remote Metadata Adapter.
 * See the ARI Protocol documentation for details on the request and response
 * messages.<br>
 * This object extends the EventEmitter object and emits the following events:
 * <ul>
 * <li>init: function(request, response) {}</li>
 * <li>getItemData: function(request, response) {}</li>
 * <li>getUserItemData: function(request, response) {}</li>
 * <li>getSchema: function(request, response) {}</li>
 * <li>getItems: function(request, response) {}</li>
 * <li>notifyUser: function(request, response) {}</li>
 * <li>notifyUserAuth: function(request, response) {}</li>
 * <li>notifyUserMessage: function(request, response) {}</li>
 * <li>notifyNewSession: function(request, response) {}</li>
 * <li>notifySessionClose: function(request, response) {}</li>
 * <li>notifyNewTables: function(request, response) {}</li>
 * <li>notifyTablesClose: function(request, response) {}</li>
 * <li>notifyMpnDeviceAccess: function(request, response) {}</li>
 * <li>notifyMpnSubscriptionActivation: function(request, response) {}</li>
 * <li>notifyMpnDeviceTokenChange: function(request, response) {}</li>
 * </ul>
 * The response argument is a MetadataResponse object and one of its methods,
 * error or success, must be called
 * in order to reply to the request bound to the event.<br>
 * The request object is an associative array containing different data
 * according to the specific request:
 * <ul>
 * <li>init: {parameters: {&lt;name 1&gt;: &lt;value 1&gt; ... &lt;name n&gt;: &lt;value n&gt;}}</li>
 * <li>getItemData: {itemNames: [&lt;item name 1&gt; ... &lt;item name n&gt;]}</li>
 * <li>getUserItemData: {userName: &lt;username&gt;, itemNames: [&lt;item name 1&gt; ... &lt;item name n&gt;]}</li>
 * <li>getSchema: {userName: &lt;username&gt;, groupName: &lt;group name&gt;, schemaName: &lt;schema name&gt;, sessionId: &lt;session id&gt;}</li>
 * <li>getItems: {userName: &lt;username&gt;, groupName: &lt;group name&gt;, sessionId: &lt;session id&gt;}</li>
 * <li>notifyUser: {userName: &lt;username&gt;, userPassword: &lt;password&gt;,
 * headers: {&lt;name 1&gt;: &lt;value 1&gt; ... &lt;name n&gt;: &lt;value n&gt;} }</li>
 * <li>notifyUserAuth: {userName: &lt;username&gt;, userPassword: &lt;password&gt;, clientPrincipal: &lt;client principal&gt;,
 * headers: {&lt;name 1&gt;: &lt;value 1&gt; ... &lt;name n&gt;: &lt;value n&gt;} }
 * <br>NOTE: clientPrincipal is related with TLS/SSL connections, which is an optional feature, available depending on Edition and License Type</li>
 * <li>notifyUserMessage: {userName: &lt;username&gt;, sessionId: &lt;session id&gt;, userMessage: &lt;message&gt;}</li>
 * <li>notifyNewSession: {userName: &lt;username&gt;, sessionId: &lt;session id&gt;,
 * contextProperties: {&lt;name 1&gt;: &lt;val 1&gt; ... &lt;name n&gt;: &lt;value n&gt;}}</li>
 * <li>notifySessionClose: {sessionId: &lt;session id&gt;}</li>
 * <li>notifyNewTables: {userName: &lt;username&gt;, sessionId: &lt;session id&gt;,
 * tableInfos: [{winIndex: &lt;win index&gt;, pubModes: &lt;publish mode&gt;, groupName: &lt;group name&gt;,
 * schemaName: &lt;schema name&gt;, firstItemIndex: &lt;first index&gt;, lastItemIndex: &lt;last index&gt;,
 * selector: &lt;selector&gt;}, ...]}</li>
 * <li>notifyTablesClose: {sessionId: &lt;session id&gt;,
 * tableInfos: [{winIndex: &lt;win index&gt;, pubModes: &lt;publish mode&gt;, groupName: &lt;group name&gt;,
 * schemaName: &lt;schema name&gt;, firstItemIndex: &lt;first index&gt;, lastItemIndex: &lt;last index&gt;,
 * selector: &lt;selector&gt;}, ...]}</li>
 * <li>notifyMpnDeviceAccess: {userName: &lt;username&gt;, sessionId: &lt;session id&gt;,
 * device: {mpnPlatformType: &lt;MPN platform type&gt;, applicationId: &lt;application ID&gt;, deviceToken: &lt;device token&gt;}}
 * <br>NOTE: Push Notifications is an optional feature, available depending on Edition and License Type</li>
 * <li>notifyMpnSubscriptionActivation: {userName: &lt;username&gt;, sessionId: &lt;session id&gt;,
 * tableInfo: {winIndex: &lt;win index&gt;, pubModes: &lt;publish mode&gt;, groupName: &lt;group name&gt;,
 * schemaName: &lt;schema name&gt;, firstItemIndex: &lt;first index&gt;, lastItemIndex: &lt;last index&gt;, selector: &lt;selector&gt;},
 * mpnSubscription: {device: {mpnPlatformType: &lt;MPN platform type&gt;, applicationId: &lt;application ID&gt;, deviceToken: &lt;device token&gt;},
 * trigger: &lt;trigger expression&gt;, notificationFormat: &lt;notification format descriptor&gt;}<br/>
 * The structure of the format descriptor depends on the platform type and it is represented as a json string;
 * <br>NOTE: Push Notifications is an optional feature, available depending on Edition and License Type</li>
 * <li>notifyMpnDeviceTokenChange: {userName: &lt;username&gt;, sessionId: &lt;session id&gt;,
 * device: {mpnPlatformType: &lt;MPN platform type&gt;, applicationId: &lt;application ID&gt;, deviceToken: &lt;device token&gt;},
 * newDeviceToken: &lt;new device token&gt;}
 * <br>NOTE: Push Notifications is an optional feature, available depending on Edition and License Type</li>
 * </ul>
 * With reference to the features qualified as optional, to know what features are enabled by your license,
 * please see the License tab of the Monitoring Dashboard (by default, available at /dashboard).<br/>
 * When the handler for some event is not supplied, a default response is provided;
 * some default responses can be configured with the optional constructor parameters.
 * The getItems and getSchema events are handler in a way similar to the
 * LiteralBasedProvider supplied with the Java in-process Adapter SDK.<br/>
 * To resume the default behavior:
 * <ul>
 * <li>init: does nothing</li>
 * <li>getItemData: for each item returns the configured distinctSnapLen, minSourceFreq, and itemAllowedModes</li>
 * <li>getUserItemData: for each item returns the configured allowedBufferSize, allowedMaxItemFreq, and userAllowedModes;
 * <br>NOTE: A further global frequency limit could also be imposed by the Server, depending on Edition and License Type.</li>
 * <li>getSchema: reads the supplied schemaName as a space-separated list of field names and returns an array of such field names</li>
 * <li>getItems: reads the supplied groupName as a space-separated list of item names and returns an array of such item names</li>
 * <li>notifyUser: returns the configured maxBandwidth and notifyTables (hence accepts the user);
 * <br>NOTE: Bandwidth Control is an optional feature, available depending on Edition and License Type</li>
 * <li>notifyUserAuth: returns the configured maxBandwidth and notifyTables (hence accepts the user)</li>
 * <li>notifyUserMessage: does nothing (hence accepts but ignores the message)</li>
 * <li>notifyNewSession: does nothing (hence accepts the session)</li>
 * <li>notifySessionClose: does nothing</li>
 * <li>notifyNewTables: does nothing (hence accepts the tables)</li>
 * <li>notifyTablesClose: does nothing</li>
 * <li>notifyMpnDeviceAccess: does nothing (hence allows the access)</li>
 * <li>notifyMpnSubscriptionActivation: does nothing (hence accepts the activation)</li>
 * <li>notifyMpnDeviceTokenChange: does nothing (hence accepts the change)</li>
 * </ul>
 *
 * @class
 * @param {Stream} stream the stream channel to the remote LS proxy adapter
 * @param {Object} [params] optional parameters used by the default request handlers. By default
 * <ul>
 * <li>maxBandwidth: 0.0</li>
 * <li>notifyTables: false</li>
 * <li>minSourceFreq: 0.0</li>
 * <li>distinctSnapLen: 0</li>
 * <li>itemAllowedModes: {raw: true, merge: true, distinct: true, command: true}</li>
 * <li>userAllowedModes: {raw: true, merge: true, distinct: true, command: true}</li>
 * <li>allowedMaxItemFreq: 0.0</li>
 * <li>allowedBufferSize: 0</li>
 * </ul>
  */
function MetadataProvider(stream, params) {

	var that, handlers, defHandlers;

	params = params || {};

	var maxBandwidth = parseFloat(params['maxBandwidth']) || 0.0;

	var notifyTables = params['notifyTables'] || false;

	var minSourceFreq = parseFloat(params['minSourceFreq']) || 0.0;

	var distinctSnapLen = parseInt(params['distinctSnapLen']) || 0;

	var itemAllowedModes = params['itemAllowedModes'] ||
		{raw: true, merge: true, distinct: true, command: true};

	var allowedMaxItemFreq = parseFloat(params['allowedMaxItemFreq']) || 0.0;

	var allowedBufferSize = parseInt(params['allowedBufferSize']) || 0;

	var userAllowedModes = params['userAllowedModes'] ||
		{raw: true, merge: true, distinct: true, command: true};

	var reader = new MetadataReader();

	// init message expected
	var initPending = true;

	// Initialize the stream encoding and the data callback
	stream.setEncoding("utf8");
	stream.on('data', handleIncomingMessage);

	/**
	 * Callback for the incoming data from the stream
	 *
	 * @private
	 */
	function handleIncomingMessage(data) {
		var message;
		reader.parse(data, initPending);
		initPending = false;
		while (!reader.isEmpty()) {
			message = reader.pop();
			// console.log("IN MESSAGE: " + inspect(message));
			// Check if there are listeners attached to the event
			// otherwise falls back to the default handler
			if (that.listeners(message.verb).length) {
				handlers[message.verb](message);
			} else {
				defHandlers[message.verb].call(that, message);
			}
		}
	}

	/**
	 * The default handlers which build a standard response
	 * using defaults parameters and the
	 * com.lightstreamer.adapters.metadata.LiteralBasedProvider
	 * logic when necessary
	 *
	 * @private
	 */
	defHandlers = {
		'init' : function(message) {
			stream.write(proto.writeInit(message.id, message.initResponseParams));
		},
		'getItemData' : function(message) {
			// Build the response using the default configuration
			var i, itemData = [];
			for (i = 0; i < message.itemNames.length; i++) {
				itemData.push({
					"distinctSnapLen": distinctSnapLen,
					"minSourceFreq": minSourceFreq,
					"allowedModes": itemAllowedModes
				});
			}
			stream.write(proto.writeGetItemData(message.id, itemData));
		},
		'notifyUser' : function(message) {
			stream.write(proto.writeNotifyUser(message.id, maxBandwidth, notifyTables));
		},
		'notifyUserAuth' : function(message) {
			stream.write(proto.writeNotifyUserAuth(message.id, maxBandwidth, notifyTables));
		},
		'getSchema' : function(message) {
			// Build the response using the default configuration
			var items = message.schemaName.split(" ");
			stream.write(proto.writeGetSchema(message.id, items));
		},
		'getItems' : function(message) {
			 // The names of the Items in the Group are returned.
			 // Group names are expected to be formed by a space separated
			 // Item list.
			var items = message.groupName.split(" ");
			stream.write(proto.writeGetItems(message.id, items));
		},
		'getUserItemData' : function(message) {
			// The names of the Fields in the Schema are returned.
			// Schema names are expected to be formed by a space separated
			// Field list.
			var i, itemData = [];
			for (i = 0; i < message.itemNames.length; i++) {
				itemData.push({
					"allowedBufferSize": allowedBufferSize,
					"allowedMaxItemFreq": allowedMaxItemFreq,
					"allowedModes": userAllowedModes
				});
			}
			stream.write(proto.writeGetUserItemData(message.id, itemData));
		},
		'notifyUserMessage' : function(message) {
			stream.write(proto.writeNotifyUserMessage(message.id));
		},
		'notifyNewSession' : function(message) {
			stream.write(proto.writeNotifyNewSession(message.id));
		},
		'notifySessionClose' : function(message) {
			stream.write(proto.writeNotifySessionClose(message.id));
		},
		'notifyNewTables' : function(message) {
			stream.write(proto.writeNotifyNewTables(message.id));
		},
		'notifyTablesClose' : function(message) {
			stream.write(proto.writeNotifyTablesClose(message.id));
		},
		'notifyMpnDeviceAccess' : function(message) {
			stream.write(proto.writeNotifyMpnDeviceAccess(message.id));
		},
		'notifyMpnSubscriptionActivation' : function(message) {
			stream.write(proto.writeNotifyMpnSubscriptionActivation(message.id));
		},
		'notifyMpnDeviceTokenChange' : function(message) {
			stream.write(proto.writeNotifyMpnDeviceTokenChange(message.id));
		}
	};

	/**
	 * The handlers that emit the request event with the proper
	 * response object.
	 *
	 * @private
	 */
	handlers = {
		'init' : function(message) {
			var responseParams = message.initResponseParams;
			delete message.initResponseParams;
				// the response parameters are not meant to be visible to the custom Adapter
			function writeInitExt(messageId) {
				var args = [ messageId, responseParams ];
				return proto.writeInit.apply(this, args);
			}
			var response = new MetadataResponse(
				stream, message,
				writeInitExt,
				proto.writeInitException);
			that.emit('init', message, response);
		},
		'getItemData' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeGetItemData,
				proto.writeGetItemDataException);
			that.emit('getItemData', message, response);
		},
		'notifyUser' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyUser,
				proto.writeNotifyUserException);
			that.emit('notifyUser', message, response);
		},
		'notifyUserAuth' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyUserAuth,
				proto.writeNotifyUserAuthException);
			that.emit('notifyUserAuth', message, response);
		},
		'getSchema' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeGetSchema,
				proto.writeGetSchemaException);
			that.emit('getSchema', message, response);
		},
		'getItems' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeGetItems,
				proto.writeGetItemsException);
			that.emit('getItems', message, response);
		},
		'getUserItemData' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeGetUserItemData,
				proto.writeGetUserItemDataException);
			that.emit('getUserItemData', message, response);
		},
		'notifyUserMessage' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyUserMessage,
				proto.writeNotifyUserMessageException);
			that.emit('notifyUserMessage', message, response);
		},
		'notifyNewSession' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyNewSession,
				proto.writeNotifyNewSessionException);
			that.emit('notifyNewSession', message, response);
		},
		'notifySessionClose' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifySessionClose,
				proto.writeNotifySessionCloseException);
			that.emit('notifySessionClose', message, response);
		},
		'notifyNewTables' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyNewTables,
				proto.writeNotifyNewTablesException);
			that.emit('notifyNewTables', message, response);
		},
		'notifyTablesClose' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyTablesClose,
				proto.writeNotifyTablesCloseException);
			that.emit('notifyTablesClose', message, response);
		},
		'notifyMpnDeviceAccess' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyMpnDeviceAccess,
				proto.writeNotifyMpnDeviceAccessException);
			that.emit('notifyMpnDeviceAccess', message, response);
		},
		'notifyMpnSubscriptionActivation' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyMpnSubscriptionActivation,
				proto.writeNotifyMpnSubscriptionActivationException);
			that.emit('notifyMpnSubscriptionActivation', message, response);
		},
		'notifyMpnDeviceTokenChange' : function(message) {
			var response = new MetadataResponse(
				stream, message,
				proto.writeNotifyMpnDeviceTokenChange,
				proto.writeNotifyMpnDeviceTokenChangeException);
			that.emit('notifyMpnDeviceTokenChange', message, response);
		},
	};

	/**
	 * Returns the configured stream.
	 *
	 * @return Object the stream
	 */
	function getStream() {
		return stream;
	}

	// Public methods
	that = {
		stream : getStream
	};

	// The object extends the standard EventEmitter
	that.__proto__ = EventEmitter.prototype;

	return that;

}

/**
 * <p>MetadataResponse constructor.
 * An instance of this class is passed as argument to an event listener,
 * and must be used to respond to the remote adapter request,
 * using the success method or the error method.</p>
 *
 * @class
 * Private constructor arguments:
 * {Stream} stream the stream channel to the remote LS server adapter
 * {Object} message the request data
 * {Function} writeSuccess callback to the serialization function for a successful response
 * {Function} writeError callback to the serialization function for an error response
 */
function MetadataResponse(stream, message, writeSuccess, writeError) {

	var isUsed = false;

	/**
	 * Sends a successful response. Parameters that can be used depends on the event handled
	 * as described in the following table:
	 * <ul>
	 * <li>init: success()</li>
	 * <li>getItemData: success([{distinctSnapLen: &lt;distinct snapshot length&gt;, minSourceFreq: &lt;min source frequency&gt;,
	 * allowedModes: {raw: &lt;raw allowed&gt;, merge: &lt;merge allowed&gt;, distinct: &lt;distinct allowed&gt;, command: &lt;command allowed&gt;}}, ...])</li>
	 * <li>getUserItemData: success([{allowedBufferSize: &lt;allowed buffer size&gt;, allowedMaxItemFreq: &lt;allowed max item frequency&gt;},
	 * allowedModes: {raw: &lt;raw allowed for user&gt;, merge: &lt;merge allowed for user&gt;, distinct: &lt;distinct allowed for user&gt;, command: &lt;command allowed for user&gt;}}, ...])</li>
	 * <li>getSchema: success([&lt;field 1&gt;, &lt;field 2&gt;, ...])</li>
	 * <li>getItems: success([&lt;item 1&gt;, &lt;item 2&gt;, ...])</li>
	 * <li>notifyUser: success(&lt;allowed max bandwidth&gt;, &lt;wants table notifications&gt;)</li>
	 * <li>notifyUserAuth: success(&lt;allowed max bandwidth&gt;, &lt;wants table notifications&gt;)</li>
	 * <li>notifyUserMessage: success()</li>
	 * <li>notifyNewSession: success()</li>
	 * <li>notifySessionClose: success()</li>
	 * <li>notifyNewTables: success()</li>
	 * <li>notifyTablesClose: success()</li>
	 * <li>notifyMpnDeviceAccess: success()</li>
	 * <li>notifyMpnSubscriptionActivation: success()</li>
	 * <li>notifyMpnDeviceTokenChange: success()</li>
	 * </ul>
	 */
	function success() {
		checkIfUsed();
		var data, args = [message.id];
		for (var i = 0; i < arguments.length; i++){
			args.push(arguments[i]);
		}
		data = writeSuccess.apply(that, args);
		stream.write(data);
	}

	/**
	 * Sends an error response. The optional exception type parameter that can be used
	 * to issue a proper type of exception depends on the event handled as described in the following table:
	 * <ul>
	 * <li>init: "metadata"</li>
	 * <li>getItemData: none</li>
	 * <li>getUserItemData: none</li>
	 * <li>getSchema: "items" or "schema"</li>
	 * <li>getItems: "items"</li>
	 * <li>notifyUser: "access" or "credits"</li>
	 * <li>notifyUserAuth: "access" or "credits"</li>
	 * <li>notifyUserMessage: "credits" or "notification"</li>
	 * <li>notifyNewSession: "credits" or "conflictingSession" or "notification"</li>
	 * <li>notifySessionClose: "notification"</li>
	 * <li>notifyNewTables: "credits" or "notification"</li>
	 * <li>notifyTablesClose: "notification"</li>
	 * <li>notifyMpnDeviceAccess: "credits" or "notification"</li>
	 * <li>notifyMpnSubscriptionActivation: "credits" or "notification"</li>
	 * <li>notifyMpnDeviceTokenChange: "credits" or "notification"</li>
	 * </ul>
	 *
	 * @param {String} exceptionMessage exception message
	 * @param {String} [exceptionType] exception type
	 * @param {Object} [exceptionData] extra information required by the exception, to be supplied
	 * as an associative array. Depending on the exception type; the following cases are possible:
	 * <ul>
	 * <li>"credits": extra information is mandatory and should have the form:
	 * {clientCode: &lt;client code&gt;, clientMessage: &lt;client message&gt;}.</li>
	 * <li>"conflictingSession": extra information is mandatory and should have the form:
	 * {clientCode: &lt;client code&gt;, clientMessage: &lt;client message&gt;, conflictingSessionId: &lt;session id&gt;}.</li>
	 * <li>Others or not specified: no extra information needed.</li>
	 * </ul>
	 * Where:
	 * <ul>
	 * <li>clientCode is an error code that can be used to distinguish the kind of problem.
	 * It must be a negative integer, or zero to mean an unspecified problem. </li>
	 * <li>clientMessage is a detail message to be forwarded to the Client.
	 * The message should be in simple ASCII, otherwise it might be altered in order
	 * to be sent to the client; multiline text is also not allowed.</li>
	 * <li>conflictingSessionId is the ID of a Session that can be closed in order to eliminate
	 * the reported problem.</li>
	 * </ul>
	 */
	function error(exceptionMessage, exceptionType, exceptionData) {
		checkIfUsed();
		var data = writeError.call(that,
			message.id, exceptionMessage, exceptionType, exceptionData);
		stream.write(data);
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
exports.MetadataProvider = MetadataProvider;