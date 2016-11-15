[![Join the chat at https://gitter.im/ChronixDB/chronix.grafana](https://badges.gitter.im/ChronixDB/chronix.grafana.svg)](https://gitter.im/ChronixDB/chronix.grafana?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/ChronixDB/chronix.grafana.svg?branch=master)](https://travis-ci.org/ChronixDB/chronix.grafana)
[![Dependency Status](https://dependencyci.com/github/ChronixDB/chronix.grafana/badge)](https://dependencyci.com/github/ChronixDB/chronix.grafana)
[![Apache License 2](http://img.shields.io/badge/license-ASF2-blue.svg)](LICENSE)

# Chronix Grafana Datasource Plugin

This is a "datasource" plugin that lets you use time series from [Chronix-Server](https://github.com/ChronixDB/chronix.server)
and visualize them with [Grafana](https://grafana.net/) datasource plugin. 

It works with Grafana > 3.X.X.

![Chronix-Grafana-Integration](img/screenshot.png)

## Features

The plugin supports all the native implemented aggregations, transformations, and analyses of Chronix-Server.
We will provide more details soon ;-)

## Usage

Currently, the plugin is only available at the chronix github repository. It is planned to release the plugin within 
the app store of grafana.

To use the plugin, simply clone this repository into your Grafana installation's `{inst-dir}/data/plugins/` directory.

Optionally, you can download and start from the example dashboard:

1. Download the latest [Chronix-Server](https://github.com/ChronixDB/chronix.server/releases/download/0.3/chronix-0.3.zip)
2. Import the dashboard from 'dashboards' into your running Grafana
3. Download and execute the [csv importer](https://github.com/ChronixDB/chronix.examples/releases/download/0.3/importer.zip) after the Chronix-Server has started

## Contributing

Is there anything missing? Do you have ideas for new features or improvements? You are highly welcome to contribute
your improvements to the Chronix projects. All you have to do is to fork this repository, improve the code and issue a 
pull request.

## Developing the plugin

### Basics

* All actual code sources live in `src` and can be written in ES6 / ES2015 - this allows us to use proper imports,
exports and all the other syntactic goodies.
* The `dist` folder is actually checked into git, too. We do this so that Grafana auto-detects the dist folder and uses
it even if you just cloned the repository into Grafana (as described above).
* This means that whenever you're changing something in `src`, you really should run the build at least once so that the
contents of `dist` are "in sync", too, when you're committing / pushing / issuing a PR.

### Set up (only needs to be done once)

Use a command prompt that provides NodeJS and NPM. In it, simply run

    npm install

to install all (dev-) dependencies for the build.

### Changing stuff

To run the build once in order to re-create the `dist` folder, run

    npm run build

If you want the build to watch your `src` files and auto-run whenever you hit save, run

    npm run watch

(you can end the watcher by pressing CTRL+C in that command prompt)

## Maintainer

Florian Lautenschlager @flolaut

## License

This software is provided under the Apache License, Version 2.0 license.

See the [LICENSE](LICENSE) file for details.
