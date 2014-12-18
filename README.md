**LiveContent login bookmarklet**

This bookmarklet helps you to quickly logon to the SDL documentation portal.

This is how to use this:

1. Make a new bookmark
2. Paste the contents of [/build/loginBookmarklet.js](https://raw.githubusercontent.com/jhorsman/LiveContentBookmarklet/master/build/loginBookmarklet.js) in the location field of the bookmark.
3. Once on the LiveContent website just click the bookmarklet and the browser will offer to remember your credentials.

Project structure
* /build/loginBookmarklet.js          the 'compiled' bookmarklet
* /build/logoutBookmarklet.js         an extra bookmarklet handy for testing.
* /source/liveContentLogin.js         the source of loginBookmarklet
* /source/liveContentLogout.js
* /test                               an offline copy of LiveContent to test offline in the plane

This bookmarklet is tested with http://sdllivecontent.sdl.com/ in Firefox 34.0 and Chrome 39.
