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
var globals = require('./consts').globals,
	types = require('./consts').types,
	values = require('./consts').values,
	modeValues = require('./consts').modeValues,
	exceptions = require('./consts').exceptions;

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
 * Values are encoded as strings.
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
 * eg. {raw: true, merge: true, distinct: false, command: false} = "R|M".
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
 * Encodes a string according to the ARI protocol.
 * 
 * @param {String} string input
 * @return {String} output
 * @private
 */
function encodeString(string) {
	if (string) {
		return encodeURIComponent(string)
			.replace(/%20/g, "+");	
	} else if (string === "") {
		return values.EMPTY;
	} else {
		return values.NULL;
	}
}

/**
 * Decodes a string according to the ARI protocol.
 * 
 * @param {String} string input
 * @return {String} output
 * @private
 */
function decodeString (string) {
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
	if (type === "access") {
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
	function parse(data) {
		var lines, i, last;
		data = tail + data;
		data = data.replace(/\r*\n+/, "\n");
		lines = data.split("\n");
		last = lines.length - 1;
		for (i = 0; i < last; i++) {
			messages.push(read(lines[i]));
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
exports.implodeDataArray = implodeDataArray;
exports.explode = explode;
exports.decodePubModes = decodePubModes;
exports.encodePubModes = encodePubModes;
exports.encodeString = encodeString;
exports.decodeString = decodeString;
exports.decodeInteger = decodeInteger;
exports.encodeInteger = encodeInteger;
exports.encodeDouble = encodeDouble;
exports.encodeBoolean = encodeBoolean;
exports.encodeMetadataException = encodeMetadataException;
exports.timestamp = timestamp;
exports.StreamReader = StreamReader;
