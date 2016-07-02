Chronix is a fast and efficient time series database based on [Apache Solr](http://lucene.apache.org/solr/).
For more information about Chronix check out [chronix.io](www.chronix.io).
The data source for connecting Chronix with Grafana is a custom data source an hence needs to be installed by your own.
But it is easy to install this plugin!

**NOTICE** The plugin is open to every contribution. So don't be shy!

## Manual Installation
The manual installation of custom plugins is easy within Grafana. 
You only have to clone the [Chronix Grafana Datasource](https://github.com/ChronixDB/chronix.grafana)repository from github and copy it into the plugin directory of grafana.
Depending on your installation method you will find the directory:

 - Package: /var/lib/grafana/plugins/ (default)
 - Custom: {your path}/grafana/public/app/plugins/


## Documentation

[KairosDB Plugin Documentation](http://docs.grafana.org/datasources/kairosdb/)

## Alternative installation method - Clone into plugins directory
Either clone this repo into your grafana plugins directory (default /var/lib/grafana/plugins if your installing grafana with package).
Restart grafana-server and the plugin should be automatically detected and used.

```
git clone git@github.com:grafana/datasource-plugin-kairosdb.git
sudo service grafana-server restart
```


## Clone into a directory of your choice

The edit your grafana.ini config file (Default location is at /etc/grafana/grafana.ini) and add this:

```ini
[plugin.kairosdb]
path = /home/your/clone/dir/datasource-plugin-kairosdb
```

Note that if you clone it into the grafana plugins directory you do not need to add the above config option. That is only
if you want to place the plugin in a directory outside the standard plugins directory. Be aware that grafana-server
needs read access to the directory.
