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
};

// Protocol data and metadata exceptions.
exports.exceptions = {
	// Exception type identifier
	GENERIC : "E",
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
	NOTIFICATION : 'EN'
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
	COMMAND : 'C'
};

// Protocol data provider methods.
exports.dataMethods = {
	// Keepalive message method
	KEEPALIVE : "KEEPALIVE",
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
	UPDATE_BY_MAP : "UD3"
}

// Protocol metadata provider methods.
exports.metadataMethods = {
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
	NOTIFY_TABLES_CLOSE : "NTC"
}

