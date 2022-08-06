'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _express = require('express');
const express = _interopRequireDefault(_express);

const _bodyParser = require('body-parser');
const bodyParser = _interopRequireDefault(_bodyParser);

const _fs = require('fs');
const fs = _interopRequireDefault(_fs);

const _https = require('https');
const https = _interopRequireDefault(_https);

const _request = require('request');
const request = _interopRequireDefault(_request);

const _config = require('./config');
const config = _interopRequireDefault(_config);

/**
Abstract:
Sets up a simple Express HTTPS server to host the example page, and handle
requests from the UI.
*/

const MERCHANT_IDENTITY_CERTIFICATE_PATH = "./certificates/merchantIdentityCert.pem";
const PAYMENT_PROCESSING_CERTIFICATE_PATH = "./certificates/paymentProcessingCert.pem";
const SSL_KEY_PATH = "./certificates/ssl_key.pem";
const SSL_CERTIFICATE_PATH = "./certificates/ssl_cert.pem";

try {
	fs.default.accessSync(MERCHANT_IDENTITY_CERTIFICATE_PATH);
	fs.default.accessSync(PAYMENT_PROCESSING_CERTIFICATE_PATH);
	fs.default.accessSync(SSL_CERTIFICATE_PATH);
	fs.default.accessSync(SSL_KEY_PATH);
} catch (e) {
	throw new Error('You must generate SSL and Apple Pay certificates.');
}

const merchantIdentityCert = fs.default.readFileSync(MERCHANT_IDENTITY_CERTIFICATE_PATH);
const paymentProcessingCert = fs.default.readFileSync(PAYMENT_PROCESSING_CERTIFICATE_PATH);
const sslKey = fs.readFileSync(SSL_KEY_PATH);
const sslCert = fs.readFileSync(SSL_CERTIFICATE_PATH);

/**
* Set up our server and static page hosting
*/
console.log('__dirname: ' + __dirname);
var options = {
	index: 'index.html',
	key: sslKey,
	cert: sslCert
};
var app = (0, express.default)();
app.use(express.default.static('public'));
app.use('/.well-known', express.default.static('.well-known'));
app.use(bodyParser.default.json());

/**
* A POST endpoint to obtain a merchant session for Apple Pay.
* The client provides the URL to call in its body.
* Merchant validation is always carried out server side rather than on
* the client for security reasons.
*/
app.post('/getApplePaySession', function (req, res) {

	// The request body should contain the URL of the ApplePay service to call
	if (!req.body.url) return res.sendStatus(400);
	console.log('/getApplePaySession ' + req.body.url);

	// We must add our ApplePay account informartion to the request
	var options = {
		url: req.body.url,
		cert: merchantIdentityCert,
		key: merchantIdentityCert,
		method: 'post',
		body: {
			merchantIdentifier: config.default.merchantIdentifier,
			domainName: config.default.merchantDomain,
			displayName: config.default.storeName
		},
		json: true
	};

	// Send the request to the Apple Pay server and return the response to the client
	(0, request.default)(options, function (err, response, body) {
		if (err) {
			console.log('Error generating Apple Pay session!');
			console.log(err, response, body);
			res.status(500).send(body);
		}
		res.send(body);
	});
});

/**
 * POST to this endpoint to confirm the order was completed successfully
 */
app.post('/completeOrder', function (req, res) {
	console.log('/completeOrder ' + req.body.orderNumber + " " + req.body.amount + " " + req.body.paymentToken);

	var options = {
		url: config.default.orderManagementUrl,
		method: 'post',
		headers: {
			"content-type": "application/json",
			"accept": "*/*",
			"authorization": "Basic " + config.default.orderManagementAuth
		},
		body: {
			"orderNumber": req.body.orderNumber,
			"amount": req.body.amount,
			"paymentToken": req.body.paymentToken
		},
		json: true
	};

	(0, request.default)(options, function (err, response, body) {
		if (err) {
			console.log(err, response, body);
			res.status(500).send(body);
		}
		res.send(body);
	});
});

https.default.createServer(app).listen(process.env.PORT || 4567);