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
var specialParameters = require('./consts').specialParameters;
var constants = require('./consts').constants;

function getSupportedVersion(protocolVersion) {
	if (protocolVersion != null) {
		// regardless of the protocol version requested, we want to speak 1.8.2
		// the proxy adapter should decide whether or not to accept
		return "1.8.2";
	} else {
		// 1.8.0 still supported,
		// the only difference is that there is no response to init
		// (and no credential messages; too late for this, but the old Proxy Adapters don't complain)
		return null;
	}
}

function getCredentials(credentials) {
    if (credentials[specialParameters.USER] != null && credentials[specialParameters.PASSWORD] != null) {
        var credentialParams = {};
        credentialParams[specialParameters.USER] = credentials[specialParameters.USER];
        credentialParams[specialParameters.PASSWORD] = credentials[specialParameters.PASSWORD];
        return credentialParams;
    } else {
        return null;
    }
}

function handleKeepalives(configuredInterval, requestedInterval, onFire) {
    if (requestedInterval <= 0 && configuredInterval <= 0) {
        // no need for keepalives
        return;
    }
    var interval;
    if (requestedInterval <= 0) {
        interval = configuredInterval;
    } else if (configuredInterval <= 0) {
        interval = requestedInterval;
    } else if (configuredInterval < requestedInterval) {
        interval = configuredInterval;
    } else {
        interval = requestedInterval;
    }
    if (interval < constants.MIN_KEEPALIVE_MILLIS) {
        interval = constants.MIN_KEEPALIVE_MILLIS;
    }

    setImmediate(onFire);
    var timer = setInterval(function() {
        try {
            if (! onFire()) {
                clearInterval(timer);
            }
        } catch (e) {
            clearInterval(timer);
        }
    }, interval);
    timer.unref();
}

function readInitParameters(message, tokens) {
	var i;
	var ariVersion = null;
	var keepaliveHint = null;
	message.parameters = {};
	for (i = 0; i < tokens.length; i = i + 4) {
		var propName = protocol.decodeString(tokens[i + 1]);
		var propValue = protocol.decodeString(tokens[i + 3]);
		if (specialParameters.ARI_VERSION === propName) {
			ariVersion = propValue;
		} else if (specialParameters.KEEPALIVE_HINT === propName) {
			keepaliveHint = propValue;
		} else {
			message.parameters[propName] = propValue;
		}
	}

	var advertisedVersion = getSupportedVersion(ariVersion);
	if (advertisedVersion != null) {
		// protocol version 1.8.2 and above
		// the version and keepalive hint are internal parameters, not to be sent to the custom Adapter
		message.initResponseParams = {};
		message.initResponseParams[specialParameters.ARI_VERSION] = advertisedVersion;
		message.keepaliveHint = keepaliveHint;
	} else {
		// protocol version 1.8.0
		if (ariVersion != null) {
			message.parameters[specialParameters.ARI_VERSION] = ariVersion;
		}
		if (keepaliveHint != null) {
			message.parameters[specialParameters.KEEPALIVE_HINT] = keepaliveHint;
		}
		message.keepaliveHint = constants.STRICT_KEEPALIVE_MILLIS; // short enough to match any reasonable setting on the Proxy Adapter side
	}
}


// Module exports
exports.handleKeepalives = handleKeepalives;
exports.getCredentials = getCredentials;
exports.readInitParameters = readInitParameters;
