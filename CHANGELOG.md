## 1.3.3 (24 Feb 2017) ##

### Bug Fixes ###

Fixed the error() method of the MetadataResponse class, whose support for the
"credits" and "conflictingSession" response was incomplete; sending such
a response would have caused a wrong message to be sent to the Server and the
message would have been refused.
The new optional exceptionData argument has been added; see the API docs for
details. Sending a "credits" or "conflictingSession" response now requires the
new argument; if omitted or wrong, an exception will be thrown.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7



## 1.3.2 (13 Sep 2016) ##

### New Features ###

Fixed a bug in the parsing of requests that could lead to incorrect results 
in case of two or more simultaneous requests.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7



## 1.3.1 (3 Nov 2014) ##

### New Features ###

Introduced suitable documentation for the default behavior of the
MetadataProvider object.

Fixed the documentation of some cases in the MetadataResponse class, which were
confused with the corresponding requests.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7



## 1.3.0 (22 Aug 2014) ##

### New Features ###

Extended the MetadataProvider object to support the new Push Notification Service
(aka MPN Module). When enabled, the new events will be issued in order to validate
client requests related with the service. See the docs for details.
Note that the MPN Module cannot be enabled in Moderato edition.

### Lightstreamer Compatibility Notes ###

Compatible with Adapter Remoting Infrastructure since 1.7



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

Compatible with Adapter Remoting Infrastructure since 1.6



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

Compatible with Adapter Remoting Infrastructure since 1.4.3
