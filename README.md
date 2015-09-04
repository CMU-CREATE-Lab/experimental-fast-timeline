# CREATE Lab Grapher

An all-JavaScript rewrite of the [BodyTrack Grapher](https://github.com/BodyTrack/Grapher), featuring significant performance improvements while supporting the same API.  Some features are still in development, but the goal is to support as many of the same features as possible.

Please see the [API docs](http://cmu-create-lab.github.io/grapher/docs/) for full details.

## Build

To build and minify, do the following:

    $ make

Doing so will create `build/grapher.min.js`.

Please note that minification is done with Google's Closure, which requires Java 1.7 or later to be installed.
    
## Documentation

To generate the API docs, first make sure you have the JSDoc Node.js module installed:

    $ npm install jsdoc -g

Then, do the following to generate the JSDocs:

    $ make docs

You'll find the generated docs in the `docs` directory.

