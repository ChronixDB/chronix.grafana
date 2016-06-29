Chronix is a fast and efficient time series database based on [Apache Solr](http://lucene.apache.org/solr/).
For more information about Chronix check out _[chronix.io](www.chronix.io)_.
The data source for connecting Chronix with Grafana is a custom data source an hence needs to be installed by your own.
But it is easy to install this plugin!

**NOTICE** The plugin is open to every contribution. So don't be shy!

## Manual Installation

The manual installation of custom plugins is easy within Grafana. 
You only have to clone the [Chronix Grafana Datasource](https://github.com/ChronixDB/chronix.grafana) repository from github and copy it into the plugin directory of grafana.
Depending on your installation method you will find the directory:

 - Package: /var/lib/grafana/plugins/ (default)
 - Custom: {your path}/grafana/public/app/plugins/

```
git clone git@github.com:grafana/ChronixDB/chronix.grafana.git
cp chronix -r / {grafana dir}/public/app/plugings/
./{grafana_dir}/bin/grafana-server
```

### Clone into a directory of your choice

The edit your grafana.ini config file (Default location is at /etc/grafana/grafana.ini) and add this:

```ini
[plugin.chronix]
path = {your clone dir}/chronix.grafana/chronix
```

Note that if you clone it into the chronix plugins directory you do not need to add the above config option. That's needed if you want
to place the plugin in a directory outside the standard plugins directory.
Then restart the grafana server to load the plugin.
Note that the grafana server needs read access to your custom location.

## Documentation

Todo