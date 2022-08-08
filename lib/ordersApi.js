'use strict';

const request = require('request');
const config = require('./config');
const logger = require('./logger');

module.exports = {

	postOrder: function(order) {
		return new Promise((resolve, reject) => {
			const options = {
				url: config.narvar.ordersApiUrl,
				method: 'post',
				headers: {
					"content-type": "application/json",
					"accept": "*/*",
					"authorization": "Basic " + config.narvar.authToken
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
				method: 'post',
				headers: {
					"content-type": "application/json",
					"accept": "*/*",
					"authorization": "Basic " + config.narvar.authToken
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