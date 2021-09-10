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

// Global protocol constants.
exports.globals = {
	// Field separator.
	SEP : "|",
	// End of message character.
	EOM : "\n",
};

// Protocol data types.
exports.types = {
	// Void type identifier
	VOID : "V",
	// String type identifier
	STRING : "S",
	// Binary type identifier
	BYTES : "Y",
	// Boolean type identifier
	BOOLEAN : "B",
	// Integer type identifier
	INT : "I",
	// Double type identifier
	DOUBLE : "D",
	// Mode type identifier
	MODE : 'M',
	// MPN platform type identifier
	MPN_PLATFORM : 'P',
};

// MPN platform types.
// Currently not used and not documented; a reference to the ARI protocol is supplied instead.
exports.mpnPlatformTypes = {
	// Refers to Push Notifications for Apple platforms, such as iOS, macOS and tvOS.
	// The back-end service for Apple platforms is APNs ("Apple Push Notification service").
	// Apple, iOS, macOS and tvOS are registered trademarks of Apple, Inc.
	Apple : "A",
	// Refers to Push Notifications for Google platforms, such as Android and Chrome.
	// The back-end service for Google platforms is FCM ("Firebase Cloud Messaging").
	// Google, Android and Chrome are registered trademarks of Google Inc.
	Google : "G",
};

// Protocol data and metadata exceptions.
exports.exceptions = {
	// Exception type identifier
	GENERIC : "E",
	// Metadata Exception type identifier
	METADATA : "EM",
	// Data Exception type identifier
	DATA : "ED",
	// Failure exception subtype identifier
	FAILURE : "EF",
	// Subscription exception subtype identifier
	SUBSCRIPTION : "EU",
	// Access exception subtype identifier
	ACCESS : 'EA',
	// Credits exception subtype identifier
	CREDITS : 'EC',
	// Confliting exception subtype identifier
	CONFLICTING_SESSION : 'EX',
	// Items exception subtype identifier
	ITEMS : 'EI',
	// Schema exception subtype identifier
	SCHEMA : 'ES',
	// Notification exception subtype identifier
	NOTIFICATION : 'EN',
};

// Protocol special value encodings.
exports.values = {
	// Encoded null value
	NULL : "#",
	// Encoded empty string value
	EMPTY : "$",
	// Encoded true value
	TRUE : "1",
	// Encoded false value
	FALSE : "0",
};

// Protocol item mode type encodings.
exports.modeValues = {
	// Encoded mode raw value
	RAW : 'R',
	// Encoded mode raw value
	MERGE : 'M',
	// Encoded mode raw value
	DISTINCT : 'D',
	// Encoded mode raw value
	COMMAND : 'C',
};

// Reserved parameters handled by the SDK.
exports.specialParameters = {
	// Protocol version
	ARI_VERSION : "ARI.version",
	// Keepalive interval requested by the Proxy Adapter to ensure it will pass the activity checks
	KEEPALIVE_HINT : "keepalive_hint.millis",
	// User credential for proxy adapter access
	USER : "user",
	// Password credential for proxy adapter access
	PASSWORD : "password",
	// Request of CLOSE message at startup
	OUTCOME : "enableClosePacket",
	// close reason on a CLOSE message
	KEY_CLOSE_REASON : "reason",
};

// Protocol data provider methods.
exports.dataMethods = {
	// Initialization method
	DATA_INIT : "DPI",
	// Subscribe message method
	SUBSCRIBE : "SUB",
	// Unsubscribe message method
	UNSUBSCRIBE : "USB",
	// Failure message method
	FAILURE : "FAL",
	// End of snapshot message method
	END_OF_SNAPSHOT : "EOS",
	// Clear snapshot message method
	CLEAR_SNAPSHOT : "CLS",
	// Update by indexed event message method
	UPDATE_BY_INDEXED_EVENT : "UD1",
	// Update by event message method
	UPDATE_BY_EVENT : "UD2",
	// Update by map (hash) event message method
	UPDATE_BY_MAP : "UD3",
};

// Protocol metadata provider methods.
exports.metadataMethods = {
	// Initialization method
	METADATA_INIT : "MPI",
	// Get item data method
	GET_ITEM_DATA : "GIT",
	// Notify user method
	NOTIFY_USER : "NUS",
	// Notify user authentication method
	NOTIFY_USER_AUTH  : "NUA",
	// Get schema method
	GET_SCHEMA  : "GSC",
	// Get items method
	GET_ITEMS : "GIS",
	// Get user item data method
	GET_USER_ITEM_DATA : "GUI",
	// Notify user message method
	NOTIFY_USER_MESSAGE : "NUM",
	// Notify new session method
	NOTIFY_NEW_SESSION : "NNS",
	// Notify session close method
	NOTIFY_SESSION_CLOSE : "NSC",
	// Notify new tables method
	NOTIFY_NEW_TABLES : "NNT",
	// Notify tables close method
	NOTIFY_TABLES_CLOSE : "NTC",
	// Notify MPN device access
	NOTIFY_MPN_DEVICE_ACCESS : "MDA",
	// Notify MPN subscription activation
	NOTIFY_MPN_SUBSCRIPTION_ACTIVATION : "MSA",
	// Notify MPN device token change
	NOTIFY_MPN_DEVICE_TOKEN_CHANGE : "MDC",
};

// Protocol methods for both providers.
exports.commonMethods = {
	// Credentials message method (since 1.8.2)
	REMOTE_CREDENTIALS : "RAC",
	// Keepalive message method
	KEEPALIVE : "KEEPALIVE",
	// Proxy close method
	CLOSE : "CLOSE",
};

// Reserved request IDs for unsolicited replies
exports.specialRequestIDs = {
	// request ID for remote credentials
	AUTH_REQUEST_ID : "1",
	// request ID for close message
	CLOSE_REQUEST_ID : "0",
};


// Predefined values
exports.constants = {
	// protection limit on keepalive interval
	MIN_KEEPALIVE_MILLIS : 1000,
	// keepalive interval hint when not received
	STRICT_KEEPALIVE_MILLIS : 1000,
	// base keepalive interval when not specified
	DEFAULT_KEEPALIVE_MILLIS : 10000,
};