
const {resolve} = require('path');
const {app, version, config, polling, fetchData, listenLog, _, express, yaml} = require(resolve(__dirname,'../base'));

const {formatters, services, combineResults, textDistance, orderResult} = require('./utils')(config, _);

process.env.PELIAS_CONFIG = `${__dirname}/pelias${config.envId}.json`;
console.log('PELIAS_CONFIG file:', process.env.PELIAS_CONFIG);

//PATCH for pelias-api that require this file
const AddressParser = require('pelias-parser/parser/AddressParser');
const peliasParser = require('pelias-parser/server/routes/parse');
const peliasApiApp = require('pelias-api/app');

app.use(express.json());

app.locals.parser = { address: new AddressParser() };
//HACK for endpoint /v1/search?text=...
function reqLog(req, res) {
	console.log('[geocoder] ',req.query)
	res.json({});
}

app.get('/libpostal/parse', peliasParser);
app.get(/^\/placeholder(.*)$/, reqLog);
app.get(/^\/pip(.*)$/, reqLog);
app.get(/^\/interpolation(.*)$/, reqLog);

app.post(/^\/_search(.*)$/, reqLog);
//TODO implement pelias /v1/search

//ElasticSearch internal proxy
app.post(/^\/pelias(.*)$/, (req, res) => {

	const {text, lang} = formatters.elasticsearchRequest(req, res);

	if(!_.isString(text) || text.length < Number(config.min_text_length)) {

		res.json( formatters.elasticsearch([]) )
	}
	else {
		combineResults(text, lang, jsonres => {
			res.json(orderResult(text, jsonres));
		});
	}
});

app.use('/tests', express.static('tests'));

app.use('/', peliasApiApp);

const serverParser = app.listen(config.listen_port, function() {
	console.log('internal services paths', app._router.stack.filter(r => r.route).map(r => `${Object.keys(r.route.methods)[0]} ${r.route.path}`) );
    console.log(`listening at http://localhost:${this.address().port}`);
});
