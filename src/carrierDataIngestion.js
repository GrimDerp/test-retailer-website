'use strict';

const request = require('request');
const config = require('./config');
const logger = require('./logger');

const MIME_TYPE_JSON = "application/json";

const getOptions = function(override) {
	const base = {
		url: config.narvar.cdiUrl,
		method: 'POST',
		headers: {
			"Content-Type": MIME_TYPE_JSON,
			"Accept": MIME_TYPE_JSON,
			"Authorization": "Basic " + config.narvar.authToken
		},
		json: true
	};
	return Object.assign(base, override);
}

const makeRequest = function(options, onsuccess) {
	return new Promise((resolve, reject) => {
		logger.log('Posting to CDI ' + options.url);
		request(options, function (err, response, body) {
			if (err) {
				logger.error('Error posting to CDI');
				logger.log(err);
				reject(err);
			} else {
				onsuccess(resolve, reject, body);
			}
		});	
	});
}

module.exports = {

	carrierEvent: function(carrierData) {
		logger.log('Posting carrier data to CDI');
		logger.log(JSON.stringify(carrierData));

		const options = getOptions({ 
			body: carrierData
		});

		return makeRequest(options, function(resolve, reject, body){
			if (body.status === 'SUCCESS') {
				if (config.featureFlags.logSuccess) {
					logger.log('Success posting carrier data to CDI');
					logger.log(body);
				}
				resolve(body);
			} else {
				logger.error('Error status in response from CDI');
				logger.log(body);
				reject(body);
			}
		});
	},
}