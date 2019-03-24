# Dark Sky Weather

BETA Branch: 

Get weather info using Dark Sky. The current implementation retrieves the current weather information. To get it working
create a new device and specify the api key and the coordinates you want to use. The devices are updated every two minutes just to be sure
to not overload the server / key usage.


# Changelog

* 0.0.8 Fixed a critical bug that prevented the application from retrieving api data.
* 0.0.7 Added extra validation on lat/long in settings and pairing. Fixed a bug in wind strength, gust strength. Its correctly converted to km/h
* 0.0.6 Added conditions for custom capabilities. Fixed some translations and added German translations
* 0.0.5 Changed the label for the highest / lowest day temperature to expected highest / lowest temperature
        swapped the highest / lowest day temp times
        Fixed the triggers in flows.
* 0.0.4 Fixed paypal link
* 0.0.3 Fixed a minor rounding error in various capabilities (humidity , cloud cover)
* 0.0.2 Fixed a bug that caused the highest and lowest temperature times to be swapped. Added units to various capabilities
* 0.0.1 First release to see if things work as they should
