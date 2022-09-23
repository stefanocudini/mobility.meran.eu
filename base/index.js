
const https = require('https');

const _ = require('lodash')
    , yaml = require('js-yaml')
    , express = require('express')
    , cors = require('cors')
    , dotenv = require('dotenv').config()
    , configyml = require('@stefcud/configyml');

const basepath = process.cwd() //path of module that includes this
    , {name, version} = require(`${basepath}/package.json`)
    , serviceName = `service ${name} v${version}`
    , configDefault = configyml({basepath: __dirname})
    , config = configyml({basepath});

config.endpoints = _.mapValues(config.endpoints, conf => {
    return _.defaults(conf, config.endpoints.default, configDefault.endpoints.default);
});
delete config.endpoints.default;

config.cors = _.defaults(config.cors, configDefault.cors);

var last_updated = Math.trunc((new Date()).getTime() / 1000 );

function polling(getData) {

    function poll() {
        last_updated = Math.trunc((new Date()).getTime() / 1000 );
        getData(last_updated);
    }
    poll(last_updated);
    let intervalObj = setInterval(poll, config.polling_interval * 1000);

    return last_updated;
}

function fetchData(endpoint) {
    return new Promise((resolve, reject) => {
        const req = https.request(endpoint, res => {
            if (res.statusCode!==200) {
                console.error(`Error to retrieve data, statusCode ${res.statusCode} try to run ./token.sh or ./token_refresh.sh`)
                reject(new Error(`http reponse code ${res.statusCode}`))
                return
            }
            var str = "";
            res.on('data', chunk => {
                str += chunk;
            });
            res.on('end', () => {
                try {
                    const {data} = JSON.parse(str);
                    resolve(data);
                }
                catch(err) {
                    console.error(`Error "${err}" to connect endpoint ${endpoint.hostname}${endpoint.path}`);
                    //reject(err)
                }
            });
        });

        req.on('error', err => {
            console.error(`Error "${err.code}" to connect endpoint ${endpoint.hostname}${endpoint.path}`);
            //reject(err)
        })
        req.end()
    });
}

const app = express();

app.use(cors(config.cors));

if (config.envId == 'dev') {
   app.set('json spaces', 2);
}

/*TODO in all modules
app.get(['/','/carsharing'], async (req, res) => {
  res.send({
    status: 'OK',
    //TODO status error if polling failed
    version
  });
});*/

console.log(`Starting ${serviceName}... ${version}\nConfig:\n`, config);

module.exports = {
    express,
    yaml,
    _,

    app,
    config,
    configDefault,
    serviceName,
    version,
    polling,
    fetchData,
    listenLog: function () {
        console.log('module paths', app._router.stack.filter(r => r.route).map(r => `${Object.keys(r.route.methods)[0]} ${r.route.path}`) );
        console.log(`${serviceName} listening at http://localhost:${this.address().port}`);
    }

/*    onInit: app => {
        console.log(`Starting ${serviceName}...`);
        console.log("Config:\n", config);
    },*/
/*    goListen: app => {
        app.listen(config.listen_port, onListen(app) );
        const {name, version} = require('./package.json');
        const serviceName = `service ${name} v${version}`;
        return function () {
            console.log( app._router.stack.filter(r => r.route).map(r => `${Object.keys(r.route.methods)[0]} ${r.route.path}`) );
            console.log(`${serviceName} listening at http://localhost:${this.address().port}`);
        }
    }*/
};