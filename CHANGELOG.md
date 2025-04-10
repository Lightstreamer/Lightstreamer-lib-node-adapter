## [1.8.1] (7 Apr 2025)

Clarified that the package is licensed under Apache License, Version 2.0.


## [1.8.0] (15 Jan 2025)

Added Typescript type definitions for better IDE support.

Added a code example in the `README.md` file showing how to import the package as an ES module or a CommonJS module.


## [1.7.0] (15 Jul 2023)

### New Features ###

Introduced the support for a single stream instead of two for the communication of the Remote Data Adapters.
In fact, since Server version 7.4, the Proxy Data Adapter can (and should) be configured to use a single connection for the communication.
Hence, the second argument of the DataProvider constructor (notifyStream) has been removed, as well as the getNotifyStream method.
Moreover, for clarity, the first argument of the DataProvider constructor (reqRespStream) has been renamed as "stream" and, for consistency, the getReqRespStream method has been renamed as "getStream".

Changed most of the supplied tests in dataprovider.test.js to operate in the new single-stream case.
Tests for the double-stream case have been left only where most significant.

### Improvements ###

Clarified the meaning of a null value for a "clientMessage" property supplied in the "exceptionData" parameter on a "error" invocation when "exceptionType" is "credits": an empty string should be sent to the client.
Note that, before 7.4, the Server used to send the "null" string as a placeholder.

### Bug Fixes ###

Fixed a bug in the interface, as getReqRespStream and getNotifyStream of DataProvider, and getStream of MetadataProvider were erroneously named reqRespStream, notifyStream, and stream, respectively.
Note that these getters are provided only for the sake of completeness and, for this reason, they are not expected to be leveraged.
Also note that, because of the extensions in the DataProvider class described above, only a getStream method is now provided for this class.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since Server version 7.4

If an existing Remote Server based on this SDK launches a Remote Data Adapter, it cannot be upgraded to this new SDK version seamlessly.
The upgrade will require a change in the code to open a single connection to the Proxy Data Adapter and use the new reduced DataAdapter constructor.
This, in turn, will require the configuration of a single port on the Proxy Data Adapter, which is only possible with Lightstreamer Server 7.4 or later.
However, if a Remote Server only launches Remote Metadata Adapters, the compatibility with Server version 7.3 is kept.

If a Remote Metadata Adapter supplies a null value for "clientMessage" and relies on the Server sending the "null" string to the clients, now it should supply "null" explicitly.



## [1.6.0] (20 Sep 2022)

### New Features ###

Added a "declareFieldDiffOrder" function to the DataProvider object; this allows for specification, before sending data for fields,
of which algorithms, and in which order, the Server should try, in order to compute the difference between a value and the previous one
in order to send the client this difference, for "delta delivery" purpose, by leveraging the extensions introduced in Server version 7.3.0.
Currently, only the JSONPATCH and DIFF_MATCH_PATCH (used for TLCP-diff) algorithms are available.

Extended the specifications of the "request" argument for the
notifyNewSession and notifySessionClose event handlers of the MetadataProvider object.
Now the elements of the tableInfos array also provide a dataAdapter property,
which specifies the Data Adapter to which tables (i.e. subscriptions) refer.

Similarly, extended the specifications of the "request" argument for the
notifyMpnSubscriptionActivation event handler of the MetadataProvider object.
Now the tableInfo attribute also provide a dataAdapter property,
which specifies the Data Adapter to which the table (i.e. subscription) refers.

### Improvements ###

Modified the String encoding according to ARI protocol version 1.9.0. This ensures a more efficient transport for almost all messages.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since Server version 7.3



## 1.5.3 (10 Sep 2021) ##

### New Features ###

Introduced full support for Server version 7.2. Now any message sent by the
Proxy Adapter when forcibly closing the connection will be available in the 'error'
event of the 'net.Socket' object supplied as the request/reply stream.

Modified the behavior when incomplete credentials are configured: now they are sent
to the Proxy Adapter, whereas previously they were not sent.
Note that, if the Proxy Adapter has credentials configured, they cannot be incomplete;
hence the Proxy Adapter is expected to refuse the connection in all cases.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since Server version 7.0



## 1.5.2 (24 May 2021) ##

### Improvements ###

Reformulated the compatibility constraint with respect to the Server version,
instead of the Adapter Remoting Infrastructure version.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since Server version 7.0



## 1.5.1 (24 Jan 2020) ##

### New Features ###

Extended the constructors of the DataProvider and MetadataProvider classes with
settings of credentials, to be sent to the Proxy Adapter upon each connection.
Credential check is an optional configuration of the Proxy Adapter;
if not leveraged, the credentials will be ignored.

Introduced the handling of keepalive packets to help keeping the connections
to the Proxy Adapter alive. This fixes possible incompatibilities with Proxy
Adapters configured to perform activity checks.
Also furtherly extended the constructors of the DataProvider and MetadataProvider
classes to provide keepalive interval settings; however the supplied settings
are only meant to restrict the Proxy Adapter requirements, if needed to support
intermediate node or to detect connection issues.

Added full support for ARI Protocol extensions introduced in
Adapter Remoting Infrastructure version 1.9 (corresponding to Server 7.1).

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.8 (corresponding to Server 7.0)

If Adapter Remoting Infrastructure 1.8.x (corresponding to Server 7.0.x) is used
and credentials to be sent to the Proxy Adapter are specified,
they will obviously be ignored, but the Proxy Adapter will issue some
log messages at WARN level on startup.

Only in the very unlikely case that Adapter Remoting Infrastructure 1.8.x
(corresponding to Server 7.0.x) were used and a custom remote parameter
named "ARI.version" were defined in adapters.xml,
this SDK would not be compatible with Lightstreamer Server, hence the Server
should be upgraded (or a different parameter name should be used).



## 1.4.2 (6 Dec 2018) ##

### Bug Fixes ###

Fixed a bug which prevented instantiation of multiple Data Adapters in the
same process, causing a "Unexpected late DPI message" error to be issued.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.8 (corresponding to Server 7.0)



## 1.4.1 (22 Feb 2018) ##

### New Features ###

Added clarifications on licensing matters in the documentation.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.8 (corresponding to Server 7.0)



## 1.4.0 (19 Dec 2017) ##

### New Features ###

Modified the interface in the part related to Mobile Push Notifications,
after the full revision of Lightstreamer Server's MPN Module.
In particular:
* Extended the specifications of the "request" argument for the
  notifyMpnDeviceAccess and notifyMpnDeviceTokenChange event handlers
  of the MetadataProvider object, to add a session ID attribute.
* Wholly revised the specifications of the "request" argument for the
  notifyMpnSubscriptionActivation event handler of the MetadataProvider
  object, in the part that reports the platform-specific attributes
  of the MPN subscription. A new notificationFormat property is now used,
  which contains the platform-specific attributes in a json string.
  See the MPN chapter on the General Concepts document for details on the
  platform-specific attributes (i.e. the Notification Format).
Note that the MPN Module cannot be enabled in Moderato edition.

Added notes in the documentation on the implication of the licensing policies.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.8 (corresponding to Server 7.0)



## 1.3.4 (20 Apr 2017) ##

### Bug Fixes ###

Fixed the formatting of the README.md page, for which a new version is required.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7 (corresponding to Server 6.0)



## 1.3.3 (24 Feb 2017) ##

### Bug Fixes ###

Fixed the error() method of the MetadataResponse class, whose support for the
"credits" and "conflictingSession" response was incomplete; sending such
a response would have caused a wrong message to be sent to Lightstreamer Server
and the message would have been refused.
The new optional exceptionData argument has been added; see the API docs for
details. Sending a "credits" or "conflictingSession" response now requires the
new argument; if omitted or wrong, an exception will be thrown.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7 (corresponding to Server 6.0)



## 1.3.2 (13 Sep 2016) ##

### Bug Fixes ###

Fixed a bug in the parsing of requests that could lead to incorrect results
in case of two or more simultaneous requests.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7 (corresponding to Server 6.0)



## 1.3.1 (3 Nov 2014) ##

### New Features ###

Introduced suitable documentation for the default behavior of the
MetadataProvider object.

Fixed the documentation of some cases in the MetadataResponse class, which were
confused with the corresponding requests.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7 (corresponding to Server 6.0)



## 1.3.0 (22 Aug 2014) ##

### New Features ###

Extended the MetadataProvider object to support the new Push Notification Service
(aka MPN Module). When enabled, the new events will be issued in order to validate
client requests related with the service. See the docs for details.
Note that the MPN Module cannot be enabled in Moderato edition.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7 (corresponding to Server 6.0)



## 1.2.0 (27 Jun 2013) ##

### New Features ###

Added the support for Remote Adapter initialization requests introduced in
ARI protocol version 1.6 and actually issued by the Proxy Adapters.
Hence, a "init" event has been added to both the MetadataProvider and
DataProvider objects. The events can be left unhandled, so no code changed
are needed.
Note that the various unit tests have been complicated somewhat, in order
to account for the protocol extension.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.6 (corresponding to Server 6.0)



## 1.1.1 (18 Jun 2013) ##

### New Features ###

Extended the "error" method of the DataResponse class, to make it similar to the Metadata Adapter case.
In order to issue an exception of type Subscription, a second argument valued "subscription" should be passed.
This changes the current behavior: with no second argument, a generic exception will now be issued.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.5

Still compatible with 1.4.3 if "clearSnapshot" is not used.



## 1.1.0 (4 Jun 2013) ##

### New Features ###

Added the clearSnapshot method to the DataProvider object.
This leverages the extension in Lightstreamer Adapter Remoting Infrastructure 1.5.

Introduced the changelog.

### Bug Fixes ###

Removed incorrect but harmless incoming message parsing details.

Clarified the documentation comments and hidden items that were supposed to be private.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.5

Still compatible with 1.4.3 if "clearSnapshot" is not used.



## 1.0.0 ##

### Initial version. ###

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.4.3 (corresponding to Server 5.1)
