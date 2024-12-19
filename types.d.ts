import { Stream } from 'node:stream';
import { EventEmitter } from 'node:events';

export class DataProvider extends EventEmitter {
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
   * In case of a subscribe event, after calling the "success" callback, it is possible to invoke "update"
   * or other item-related methods, or to predispose for future invocations when data is available.
   * Then, upon an unsubscribe event, any existing such predisposition should be deactivated before calling
   * the "success" callback.
   * @class
   * @param {Stream} stream the stream channel to the remote LS Proxy Data Adapter.
   * In case of interruption, the 'error' event on the stream may report interruption cause details.
   * @param {Function} [isSnapshotAvailable] optional callback that receives an itemName as argument and must return
   * a boolean value asserting if the item supports snapshot. The default value is function(itemName) {return false;}
   * @param {Object} [credentials] optional credentials to be submitted to the remote LS Proxy Data Adapter.
   * The credentials are needed only if the Proxy Adapter is configured to require Remote Adapter authentication.
   * If needed, the supplied object should contain both a "user" and a "password" field.
   * @param {Number} [keepaliveInterval] optional time in milliseconds between subsequent keepalive packets
   * to be sent on the reply stream to prevent LS Proxy Data Adapter and any intermediate nodes
   * from closing the connection for inactivity; a value of 0 or negative means no keepalives; the default
   * if not supplied is 10000 ms. However, if a stricter interval is requested by the Proxy Adapter
   * on startup, it will be obeyed (with a safety minimum of 1 second). This should ensure that the
   * Proxy Adapter activity checks will always succeed, but for some old versions of the Proxy Adapter.
   * The keepalives can also allow for prompt detection of connection issues.
   */
  constructor(stream: Stream, isSnapshotAvailable?: Function, credentials?: object, keepaliveInterval?: number);

  /**
	 * Sends an update for a particular item to the remote LS proxy.
	 *
	 * @param {String} itemName the item name
	 * @param {Boolean} isSnapshot is it a snapshot?
	 * @param {Object} data an associative array of strings
	 * that represents the data to be published
	 */
	update(itemName: string, isSnapshot: boolean, data: object): DataProvider;

  /**
	 * Sends an end of snapshot message for a particular item to the remote LS proxy.
	 *
	 * @param {String} itemName the item name
	 */
	endOfSnapshot(itemName: string): DataProvider;

  /**
	 * Sends a clear snapshot message for a particular item to the remote LS proxy.
	 *
	 * @param {String} itemName the item name
	 */
	clearSnapshot(itemName: string): DataProvider;

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
	declareFieldDiffOrder(itemName: string, algorithmsMap: object): DataProvider;

  /**
	 * Sends a failure message to the remote LS proxy.
	 *
	 * @param {String} exception the exception message
	 */
	failure(exception: string): DataProvider;

  /**
	 * Returns the configured stream.
	 *
	 * @return Object the stream 
	 */
	getStream(): Stream;
}

/**
 * <p>An instance of this class is passed as argument to an event listener,
 * and must be used to respond to the remote adapter request,
 * using the success method or the error method.</p>
 */
export class DataResponse {
  /**
	 * Sends a successful response.
	 */
	success(): void;

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
	error(exceptionMessage: string, exceptionType: string): void;
}

export class MetadataProvider extends EventEmitter {
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
   * tableInfos: [{winIndex: &lt;win index&gt;, pubModes: &lt;publish mode&gt;, groupName: &lt;group name&gt;, dataAdapter: &lt;data adapter&gt;,
   * schemaName: &lt;schema name&gt;, firstItemIndex: &lt;first index&gt;, lastItemIndex: &lt;last index&gt;,
   * selector: &lt;selector&gt;}, ...]}</li>
   * <li>notifyTablesClose: {sessionId: &lt;session id&gt;,
   * tableInfos: [{winIndex: &lt;win index&gt;, pubModes: &lt;publish mode&gt;, groupName: &lt;group name&gt;, dataAdapter: &lt;data adapter&gt;,
   * schemaName: &lt;schema name&gt;, firstItemIndex: &lt;first index&gt;, lastItemIndex: &lt;last index&gt;,
   * selector: &lt;selector&gt;}, ...]}</li>
   * <li>notifyMpnDeviceAccess: {userName: &lt;username&gt;, sessionId: &lt;session id&gt;,
   * device: {mpnPlatformType: &lt;MPN platform type&gt;, applicationId: &lt;application ID&gt;, deviceToken: &lt;device token&gt;}}
   * <br>NOTE: Push Notifications is an optional feature, available depending on Edition and License Type</li>
   * <li>notifyMpnSubscriptionActivation: {userName: &lt;username&gt;, sessionId: &lt;session id&gt;,
   * tableInfo: {winIndex: &lt;win index&gt;, pubModes: &lt;publish mode&gt;, groupName: &lt;group name&gt;, dataAdapter: &lt;data adapter&gt;,
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
   * @param {Stream} stream the stream channel to the remote LS Proxy Metadata Adapter.
   * In case of interruption, the 'error' event on the stream may report interruption cause details.
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
   * @param {Object} [credentials] optional credentials to be submitted to the remote LS Proxy Metadata Adapter.
   * The credentials are needed only if the Proxy Adapter is configured to require Remote Adapter authentication.
   * If needed, the supplied object should contain both a "user" and a "password" field.
   * @param {Number} [keepaliveInterval] optional time in milliseconds between subsequent keepalive packets
   * to be sent on the reply stream to prevent LS Proxy Metadata Adapter and any intermediate nodes from closing
   * the connection for inactivity; a value of 0 or negative means no keepalives; the default
   * if not supplied is 10000 ms. However, if a stricter interval is requested by the Proxy Adapter
   * on startup, it will be obeyed (with a safety minimum of 1 second). This should ensure that the
   * Proxy Adapter activity checks will always succeed, but for some old versions of the Proxy Adapter.
   * The keepalives can also allow for prompt detection of connection issues.
   */
  constructor(stream: Stream, params?: object, credentials?: object, keepaliveInterval?: number);

  /**
	 * Returns the configured stream.
	 *
	 * @return Object the stream
	 */
	getStream(): Stream;
}

/**
 * <p>An instance of this class is passed as argument to an event listener,
 * and must be used to respond to the remote adapter request,
 * using the success method or the error method.</p>
 */
export class MetadataResponse {
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
	success(): void;

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
	 * <li>clientMessage is a detail message to be forwarded to the Client. It can
	 * be null, in which case an empty string message will be assumed.
	 * The message is free, but if it is not in simple ASCII or if it is
	 * multiline, it might be altered in order to be sent to very old
	 * non-TLCP clients.</li>
	 * <li>conflictingSessionId is the ID of a Session that can be closed in order to eliminate
	 * the reported problem.</li>
	 * </ul>
	 */
	 error(exceptionMessage: string, exceptionType?: string, exceptionData?: object): void;
}