'use strict';

const request = require('request');
const config = require('./config');
const logger = require('./logger');

const MIME_TYPE_JSON = "application/json";

const getOptions = function(override) {
	const base = {
		url: config.narvar.ordersApiUrl,
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

const makeRequest = function(options) {
	return new Promise((resolve, reject) => {
		logger.log('Posting to Orders API ' + options.url);
		request(options, function (err, response, body) {
			if (err) {
				logger.error('Error posting order to the orders API');
				logger.log(JSON.stringify(err));
				reject(err);
			} else {
				if (body.status === 200) {
					logger.log('Success posting order to Orders API');
					logger.log(JSON.stringify(body));
					resolve(body);
				} else {
					logger.error('Error status in response from Orders API');
					logger.log(JSON.stringify(body));
					reject(body);
				}
			}
		});	
	});
}

module.exports = {

	postOrder: function(order) {
		const options = getOptions({ 
			url: config.narvar.ordersApiUrl,
			body: order
		});
		return makeRequest(options);
	},

	getOrderDetails: function(order) {
		const options = getOptions({ 
			url: config.narvar.ordersApiUrl + '/apple-wallet/' + order.orderNumber,
			body: order
		});
		return makeRequest(options);
	}
}