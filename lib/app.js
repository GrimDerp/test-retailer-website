'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const request = require('request');
const config = require('./config');
const logger = require('./logger');
const { v4: uuid } = require('uuid');
/**
Abstract:
Sets up a simple Express HTTPS server to host the example page, and handle
requests from the UI.
*/

try {
	fs.accessSync(config.merchant.identificationCertFile);
	fs.accessSync(config.applePay.paymentProcessingCertFile);
	fs.accessSync(config.ssl.certFile);
	fs.accessSync(config.ssl.keyFile);
} catch (e) {
	throw new Error('Some certificate filea are missing.\n' + e);
}

const merchantIdentityCert = fs.readFileSync(config.merchant.identificationCertFile);
const paymentProcessingCert = fs.readFileSync(config.applePay.paymentProcessingCertFile);
const sslKey = fs.readFileSync(config.ssl.keyFile);
const sslCert = fs.readFileSync(config.ssl.certFile);

/**
* Set up our server and static page hosting
*/
logger.log('__dirname: ' + __dirname);
var options = {
	index: 'index.html',
	key: sslKey,
	cert: sslCert
};
var app = express();
app.use(express.static('public'));
app.use('/.well-known', express.static('.well-known'));
app.use(bodyParser.json());

/**
* This acts as a reverse proxy for calls to the ApplePay servers. Whenever
* ApplePay on the client want to call the ApplePay server, it POSTs the
* URL of the endpoint here. The retailer must POST to the requested URL
* using the Merchant identification certificate over a mTLS connection
* to Apple servers.
*/
app.post('/proxyApplePay', function (req, res) {

	// The request body should contain the URL of the ApplePay service to call
	if (!req.body.url) return res.sendStatus(400);
	logger.log('/getApplePaySession ' + req.body.url);

	// We must add our ApplePay account informartion to the request
	var options = {
		url: req.body.url,
		cert: merchantIdentityCert,
		key: merchantIdentityCert,
		method: 'post',
		body: {
			merchantIdentifier: config.merchant.identifier,
			domainName: config.merchant.domain,
			displayName: config.storeName
		},
		json: true
	};

	// Send the request to the Apple Pay server and return the response to the client
	request(options, function (err, response, body) {
		if (err) {
			logger.log('Error generating Apple Pay session!');
			logger.log(err, response, body);
			res.status(500).send(body);
		}
		res.send(body);
	});
});

const ordersApi = function(){
	const postOrder = function(order) {
		return new Promise((resolve, reject) => {
			request({
				url: config.narvar.url,
				method: 'post',
				headers: {
					"content-type": "application/json",
					"accept": "*/*",
					"authorization": "Basic " + config.narvar.authToken
				},
				body: order,
				json: true
			}, function (err, response, body) {
				if (err) {
					logger.error(err, response, body);
					reject();
				} else {
					resolve();
				}
			});	
		});
	}

	const getOrderDetails = function(order) {
		return new Promise((resolve, reject) => {
			resolve({
				orderTypeIdentifier: 'narvar_1',
				orderIdentifier: order.retailer + '.' + order.orderNumber,
				webServiceURL: 'https://apple-wallet.narvar.com',
				authenticationToken: '1:retailer:1:lksfJASGwagragr'
			});
			// request({
			// 	url: config.narvar.url,
			// 	method: 'post',
			// 	headers: {
			// 		"content-type": "application/json",
			// 		"accept": "*/*",
			// 		"authorization": "Basic " + config.narvar.authToken
			// 	},
			//  body: order,
			// 	json: true
			// }, function (err, response, body) {
			// 	if (err) {
			// 		logger.error(err, response, body);
			// 		reject();
			// 	} else {
			// 		resolve(body);
			// 	}
			// });	
		});
	}

	return {
		postOrder,
		getOrderDetails
	}
}();

/**
 * POST to this endpoint to confirm the order was successfully paid
 */
app.post('/completeOrder', function (req, res) {
	logger.log('/completeOrder ' + req.body.paymentRequest + " " + req.body.paymentToken);

	const order = {
		retailer: 'peninsular_interactive',
		orderNumber: uuid.v4()
	}

	return ordersApi.getOrderDetails(order)
		.then((orderDetails) => {
			ordersApi.postOrder(order)
			.then(() => {
				res.status(200).send({ orderDetails });
			})
			.catch((err) => {
				logger.error(err + ' posting the order');
				res.status(500).send({});
			});
	
		})
		.catch((err) => {
			logger.error(err + ' getting order details');
			res.status(500).send({});
	});
});

https.createServer(options, app).listen(config.ssl.port);