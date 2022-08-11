'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const request = require('request');

const logger = require('./logger');
const config = require('./config');
const ordersApi = require('./ordersApi');
const certificates = require('./certificates');
const orders = require('./orders');
const { json } = require('body-parser');

/**
* Set up our server and static page hosting
*/
var app = express();
app.use(express.static('public'));
app.use('/.well-known', express.static('.well-known'));
app.use(bodyParser.json());

/**
* This acts as a reverse proxy for calls to the ApplePay servers. Whenever
* ApplePay on the client needs to call the ApplePay server, it POSTs the
* URL of the endpoint here. The retailer must POST to the requested URL
* using the Merchant identification certificate over a mTLS connection
* to Apple servers.
*/
app.post('/proxyApplePay', function (req, res) {

	// The request body should contain the URL of the ApplePay service to call
	if (!req.body.url) return res.sendStatus(400);

	// We must add our ApplePay account informartion to the request
	const options = {
		url: req.body.url,
		cert: certificates.getMerchantIdentityCert(),
		key: certificates.getMerchantIdentityCert(),
		method: 'post',
		body: {
			merchantIdentifier: config.merchant.identifier,
			domainName: config.merchant.domain,
			displayName: config.storeName
		},
		json: true
	};

	// Send the request to the Apple Pay server and return the response to the client
	logger.log('/proxyApplePay ' + req.body.url);
	request(options, function (err, response, body) {
		if (err) {
			logger.log('Error calling Apple Pay servers');
			logger.log(JSON.stringify(err));
			res.status(500).send(body);
		}
		res.send(body);
	});
});

/**
 * POST to this endpoint to confirm the order was successfully paid. This will construct
 * an order from the cart contents and paymentn information, post this to Narvar and
 * return the order details required for Apple Wallet integration
 */
app.post('/completeOrder', function (req, res) {
	logger.log('/completeOrder');
	logger.log(JSON.stringify(req.body));

	// Construct an order from the shopping cart and payment information
	const order = orders.create(req.body);

	// Post the order to Narvar and get order details for Apple Wallet integration
	return ordersApi.getOrderDetails(order)
		.then((orderDetails) => {
			ordersApi.postOrder(order)
			.then(() => {
				res.status(200).send({ orderDetails });
			})
			.catch((err) => {
				logger.error('Error posting the order');
				logger.log(JSON.stringify(err));
				res.status(500).send(err);
			});
	
		})
		.catch((err) => {
			logger.error('Error getting order details');
			logger.log(JSON.stringify(err));
			res.status(500).send(err);
	});
});

/**
 * The load balancer will get this endpoint to know when the
 * website is ready to serve requests
 */
app.get('/health_check', (req, res) => { res.send('ok') })

logger.log('__dirname: ' + __dirname);
const options = {
	index: 'index.html'
};
if (config.ssl.enabled) {
	options.key = certificates.getSSLKey();
	options.cert = certificates.getSSLCert();
	logger.log('Serving requests on port ' + config.port + ' with SSL');
	https.createServer(options, app).listen(config.port);
} else {
	logger.log('Serving requests on port ' + config.port + ' no SSL');
	http.createServer(options, app).listen(config.port);
}