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
var globals = require('./consts').globals;
var types = require('./consts').types;
var values = require('./consts').values;
var modeValues = require('./consts').modeValues;
var algValues = require('./consts').algValues;
var exceptions = require('./consts').exceptions;

/**
 * Concatenates the arguments in a pipe-delimited string
 *
 * @return {String} the pipe-delimited string
 * @private
 */
function implodeMessage() {
	return implodeArray(arguments) + globals.EOM;
}

/**
 * Concatenates the array in a pipe-delimited string
 *
 * @param {Array} tokens to be concatenated
 * @return {String} the pipe-delimited string
 * @private
 */
function implodeArray(tokens) {
	var message = "", i, l;
	l = tokens.length;
	for (i = 0; i < l; i++) {
		message += (i > 0 ? globals.SEP : "") + tokens[i];
	}
	return message;
}

/**
 * Concatenates the associative array in a pipe-delimited string
 * in the following form FIELD_TYPE_STRING|key|FIELD_TYPE_STRING|value.
 * Values are encoded as strings according to ARI protocol 1.9.0 or later.
 *
 * @param {Array} data an associative array
 * @return {String} the pipe-delimited string
 * @private
 */
function implodeData(data) {
	var dataArray = [], field;
	for(field in data) {
		dataArray.push(types.STRING);
		dataArray.push(encodeString(field));
		dataArray.push(types.STRING);
		dataArray.push(encodeString(data[field]));
	}
	return implodeArray(dataArray);
}

/**
 * Concatenates the associative array in a pipe-delimited string
 * in the following form FIELD_TYPE_STRING|key|FIELD_TYPE_STRING|value.
 * Values are encoded as strings in the backward-compatible way according to ARI protocol 1.9.0 or later.
 *
 * @param {Array} data an associative array
 * @return {String} the pipe-delimited string
 * @private
 */
function implodeDataOld(data) {
	var dataArray = [], field;
	for(field in data) {
		dataArray.push(types.STRING);
		dataArray.push(encodeStringOld(field));
		dataArray.push(types.STRING);
		dataArray.push(encodeStringOld(data[field]));
	}
	return implodeArray(dataArray);
}

/**
 * Concatenates the associative array in a pipe-delimited string
 * in the syntax required for field "diff" algorithm lists.
 *
 * @param {Array} algorithmsMap an associative array of field "diff" algorithm lists
 * @return {String} the pipe-delimited string
 * @private
 */
function implodeFieldDiffOrder(algorithmsMap) {
	var dataArray = [], field;
	for(field in algorithmsMap) {
		dataArray.push(types.STRING);
		dataArray.push(encodeString(field));
		dataArray.push(types.DIFF_ALGORITHM);
		dataArray.push(encodeFieldAlgorithms(algorithmsMap[field]));
	}
	return implodeArray(dataArray);
}

/**
 * Concatenates the array values in a pipe-delimited string
 * in the following form FIELD_TYPE_STRING|value.
 * Values are encoded as strings.
 *
 * @param {Array} data fields to be encoded
 * @return {String} the pipe-delimited string
 * @private
 */
function implodeDataArray(data) {
	var dataArray = [], i, l;
	l = data.length;
	for(i = 0; i < l; i++) {
		dataArray.push(types.STRING);
		dataArray.push(encodeString(data[i]));
	}
	return implodeArray(dataArray);
}

/**
 * Splits the pipe-delimited string in an array.
 *
 * @param {String} message pipe-delimited string
 * @return {Array} the fields contained in the string
 * @private
 */
function explode(message) {
	return message.split(globals.SEP);
}

/**
 * Decodes a string as a publish mode associative array.
 * eg. "M|R" = {raw: true, merge: true, distinct: false, command: false}.
 *
 * @param {String} string pipe-delimited string
 * @return {Array} publish mode flags
 * @private
 */
function decodePubModes(string) {
	var decStr, mode, i, l;
	decStr = decodeString(string);
	mode = {raw : false, merge : false,	distinct : false, command : false};

	if (decStr) {
		l = decStr.length;
		for(i = 0; i < l; i++) {
			if (decStr.charAt(i) === modeValues.RAW) {
				mode.raw = true;
			} else if (decStr.charAt(i) === modeValues.MERGE) {
				mode.merge = true;
			} else if (decStr.charAt(i) === modeValues.DISTINCT) {
				mode.distinct = true;
			} else if (decStr.charAt(i) === modeValues.COMMAND) {
				mode.command = true;
			} else {
				throw new Error('Invalid mode "' + decStr.charAt(i) + '"');
			}

		}
	}
	return mode;
}

/**
 * Encodes a publish mode associative array in a ARI protocol string form.
 * eg. {raw: true, merge: true, distinct: false, command: false} = "RM".
 *
 * @param {Array} modes publish mode flags
 * @return {String} pipe-delimited string
 * @private
 */
function encodePubModes(modes) {
	var string = "";
	if(modes.raw) {
		string = string + modeValues.RAW;
	};
	if(modes.merge) {
		string = string + modeValues.MERGE;
	};
	if(modes.distinct) {
		string = string + modeValues.DISTINCT;
	};
	if(modes.command) {
		string = string + modeValues.COMMAND;
	};
	if (!string) {
		throw new Error("No modes are specified");
	}
	return string;
}

/**
 * Encodes a field "diff" algorithm list in a ARI protocol string form.
 * eg. [ "JSONPATCH", "DIFF_MATCH_PATCH" ] = "JM".
 *
 * @param {Array} algorithms array of algorithm names
 * @return {String} pipe-delimited string
 * @private
 */
function encodeFieldAlgorithms(algorithms) {
	if (algorithms === null) {
		return values.NULL;
	}
	var string = "";
	var len = algorithms.length;
	var i;
	for (i = 0; i < len; i++) {
		if (algValues[algorithms[i]] != null) {
			string = string + algValues[algorithms[i]];
		}
	}
	if (!string) {
		return values.EMPTY;
	}
	return string;
}

function percentEncode(c) {
	var hex = c.charCodeAt(0).toString(16).toUpperCase();
	if (hex.length == 1) {
		return "%0" + hex;
	} else {
		// assert(hex.length == 2);
		return "%" + hex;
	}
}

/**
 * Encodes a string according to ARI protocol (also referred to as ARI "Smart Encoding").
 *
 * @param {String} string input
 * @return {String} output
 * @private
 */
function encodeString(string) {
	//it actually accepts any kind of object as input
	if (string === null) {
		return values.NULL;
	} else if (string === "") {
		return values.EMPTY;
	} else if (string == values.NULL || string == values.EMPTY) {
		return percentEncode(string);
	} else {//0 false undefined NaN will pass from here
		return String(string).replace(/[|%+\r\n]/g, percentEncode);
	}
}

/**
 * Encodes a string in the backward-compatible way according to ARI protocol
 * (also referred to as ARI "Backward-Compatibility Encoding").
 *
 * @param {String} string input
 * @return {String} output
 * @private
 */
function encodeStringOld(string) {
	//it actually accepts any kind of object as input
	if (string === null) {
		return values.NULL;
	} else if (string === "") {
		return values.EMPTY;
	} else {//0 false undefined NaN will pass from here
		return encodeURIComponent(string)
		.replace(/%20/g, "+");
	}
}

/**
 * Decodes a string according to ARI protocol (also referred to as ARI "Smart Encoding").
 *
 * @param {String} string input
 * @return {String} output
 * @private
 */
function decodeString(string) {
	if (string === values.EMPTY) {
		return "";
	} else if (string === values.NULL) {
		return null;
	} else {
		return decodeURIComponent(string);
	}
}

/**
 * Decodes a string in the backward-compatible way according to ARI protocol
 * (also referred to as ARI "Backward-Compatibility Encoding").
 *
 * @param {String} string input
 * @return {String} output
 * @private
 */
function decodeStringOld(string) {
	if (string === values.EMPTY) {
		return "";
	} else if (string === values.NULL) {
		return null;
	} else {
		return decodeURIComponent(
			string.replace(/\+/g,"%20"));
	}
}

/**
 * Decodes an integer according to the ARI protocol.
 *
 * @param {String} string input
 * @return {Number} output
 * @private
 */
function decodeInteger(string) {
	if (string === values.NULL) {
		return null;
	} else {
		return parseInt(string);
	}
}

/**
 * Encodes an integer according to the ARI protocol.
 *
 * @param {Number} value input
 * @return {String} output
 * @private
 */
function encodeInteger(value) {
	if (value === null) {
		return values.NULL;
	} else if (!isNaN(value) && parseInt(value)==value) {
		return value + "";
	} else {
		throw new Error('Invalid integer value "' + value + '"');
	}
}

/**
 * Encodes a float according to the ARI protocol.
 *
 * @param {Number} value input
 * @return {String} output
 * @private
 */
function encodeDouble(value) {
	if (value === null) {
		return values.NULL;
	} else if (!isNaN(value)) {
		return value + "";
	} else {
		throw new Error('Invalid double value "' + value + '"');
	}
}

/**
 * Encodes a boolean according to the ARI protocol.
 *
 * @param {Boolean} bool input
 * @return {String} output
 * @private
 */
function encodeBoolean(bool) {
	return bool ? values.TRUE : values.FALSE;
}

/**
 * Encodes a metadata exception type.
 *
 * @param {Boolean} type input
 * @return {String} output
 * @private
 */
function encodeMetadataException(type) {
	if (type === "metadata") {
		return exceptions.METADATA;
	} else if (type === "access") {
		return exceptions.ACCESS;
	} else if (type === "credits") {
		return exceptions.CREDITS;
	} else if (type === "conflictingSession") {
		return exceptions.CONFLICTING_SESSION;
	} else if (type === "items") {
		return exceptions.ITEMS;
	} else if (type === "schema") {
		return exceptions.SCHEMA;
	} else if (type === "notification") {
		return exceptions.NOTIFICATION;
	} else {
		return exceptions.GENERIC;
	}
}

/**
 * Generates a timestamp.
 *
 * @return {String} time millis
 * @private
 */
function timestamp() {
	return new Date().getTime() + "";
}

/**
 * <p>StreamReader constructor.</p>
 *
 * @class
 * @param {Function} read the function to parse the message
 * @private
 */
function StreamReader(read) {

	var tail = '', messages = new Array();

	/**
	 * Parsa new data.
	 * @param {String} data New data from the stream
	 */
	function parse(data, initPending) {
		var lines, i, last;
		data = tail + data;
		data = data.replace(/\r*\n+/g, "\n");
		lines = data.split("\n");
		last = lines.length - 1;
		for (i = 0; i < last; i++) {
			messages.push(read(lines[i], initPending));
		}
		tail = lines[lines.length - 1];
	}

	/**
	 * Pop the next message
	 */
	function pop() {
		return messages.shift();
  	}

	/**
	 * Return if it has no more messages
	 */
	function isEmpty() {
		return messages.length == 0;
  	}

	// Public methods
	that = {
		parse: parse,
		pop: pop,
		isEmpty: isEmpty
	};


	return that;
}


// Module exports
exports.implodeMessage = implodeMessage;
exports.implodeArray = implodeArray;
exports.implodeData = implodeData;
exports.implodeDataOld = implodeDataOld;
exports.implodeDataArray = implodeDataArray;
exports.implodeFieldDiffOrder = implodeFieldDiffOrder;
exports.explode = explode;
exports.decodePubModes = decodePubModes;
exports.encodePubModes = encodePubModes;
exports.encodeString = encodeString;
exports.encodeStringOld = encodeStringOld;
exports.decodeString = decodeString;
exports.decodeStringOld = decodeStringOld;
exports.decodeInteger = decodeInteger;
exports.encodeInteger = encodeInteger;
exports.encodeDouble = encodeDouble;
exports.encodeBoolean = encodeBoolean;
exports.encodeMetadataException = encodeMetadataException;
exports.timestamp = timestamp;
exports.StreamReader = StreamReader;
