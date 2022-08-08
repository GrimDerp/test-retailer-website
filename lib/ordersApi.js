'use strict';

const request = require('request');
const config = require('./config');
const logger = require('./logger');

const MIME_TYPE_JSON = "application/json";

module.exports = {

	postOrder: function(order) {
		return new Promise((resolve, reject) => {
			const options = {
				url: config.narvar.ordersApiUrl,
				method: 'POST',
				headers: {
					"Content-Type": MIME_TYPE_JSON,
					"Accept": MIME_TYPE_JSON,
					"Authorization": "Basic " + config.narvar.authToken
				},
				body: order,
				json: true
			};
			request(options, function (err, response, body) {
				if (err) {
					logger.error(err + ' posting order to the orders API');
					reject(err);
				} else {
					resolve(body);
				}
			});	
		});
	},

	getOrderDetails: function(order) {
		return new Promise((resolve, reject) => {
			const options = {
				url: config.narvar.ordersApiUrl + '/apple-wallet/' + order.orderNumber,
				method: 'POST',
				headers: {
					"Content-Type": MIME_TYPE_JSON,
					"Accept": MIME_TYPE_JSON,
					"Authorization": "Basic " + config.narvar.authToken
				},
			 	body: order,
				json: true
			};
			request(options, function (err, response, body) {
				if (err) {
					logger.error(err = ' getting orderDetails from orders API');
					reject(err);
				} else {
					resolve(body);
				}
			});	
		});
	}
}