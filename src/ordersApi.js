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
			"Authorization": "Basic " + config.merchant.authToken
		},
		json: true
	};
	return Object.assign(base, override);
}

const makeRequest = function(options, onsuccess) {
	return new Promise((resolve, reject) => {
		logger.log('Posting to Orders API ' + options.url);
		request(options, function (err, response, body) {
			if (err) {
				logger.error('Error posting to the orders API');
				logger.log(err);
				reject(err);
			} else {
				onsuccess(resolve, reject, body);
			}
		});	
	});
}

module.exports = {

	postOrder: function(order) {
		if (config.featureFlags.logPaymentDetails) {
			logger.log('Posting order information to Narvar');
			logger.log(JSON.stringify(order));
		}

		const options = getOptions({ 
			url: config.narvar.ordersApiUrl,
			body: order
		});

		return makeRequest(options, function(resolve, reject, body){
			if (body.status === 'SUCCESS') {
				if (config.featureFlags.logSuccess) {
					logger.log('Success posting order to Orders API');
					logger.log(body);
				}
				resolve(body);
			} else {
				logger.error('Error status in response from Orders API');
				logger.log(body);
				reject(body);
			}
		});
	},

	updateOrder: function(order, orderNumber) {
		if (config.featureFlags.logPaymentDetails) {
			logger.log('Updating Narvar order details for order ' + orderNumber);
			logger.log(JSON.stringify(order));
		}

		const options = getOptions({ 
			method: "PUT",
			url: config.narvar.ordersApiUrl + "/" + orderNumber,
			body: order
		});

		return makeRequest(options, function(resolve, reject, body){
			if (body.status === 'SUCCESS') {
				if (config.featureFlags.logSuccess) {
					logger.log('Success updating Narvar order information');
					logger.log(body);
				}
				resolve(body);
			} else {
				logger.error('Error status in response from Orders API');
				logger.log(body);
				reject(body);
			}
		});
	},

	getOrderDetails: function(order) {
		const orderNumber = order.order_info.order_number;
		logger.log('Getting order details from Narvar for ' + orderNumber);

		const options = getOptions({ 
			url: config.narvar.ordersApiUrl + '/apple-wallet/' + orderNumber,
			body: order
		});

		return makeRequest(options, function(resolve, reject, body){
			if (config.featureFlags.logSuccess) {
				logger.log('Success getting order details from Orders API');
				logger.log(body);
			}
			resolve(body);
		});
	}
}