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
const orderBuilder = require('./orderBuilder');
const carrierDataBuilder = require('./carrierDataBuilder');
const carrierDataIngestion = require('./carrierDataIngestion');

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
	if (!req.body.url) return res.sendStatus(400);

	if (config.featureFlags.logPaymentDetails) {
		logger.log('/proxyApplePay ' + req.body.url);
	}

	const options = {
		url: req.body.url,
		cert: certificates.getMerchantIdentityCert(),
		key: certificates.getMerchantIdentityCert(),
		method: 'POST',
		body: {
			merchantIdentifier: config.merchant.identifier,
			domainName: config.merchant.domain,
			displayName: config.storeName
		},
		json: true
	};

	request(options, function (err, response, body) {
		if (err) {
			logger.log('Error calling Apple Pay servers');
			logger.log(err);
			res.status(500);
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
	const paymentRequest = req.body.paymentRequest;
	const payment = req.body.payment;
	const shippingContact = payment.shippingContact;
	const shippingMethod = paymentRequest.lineItems[0];

	if (config.featureFlags.logPaymentDetails) {
		logger.log('/completeOrder');
		logger.log(req.body);

		logger.log('payment.token.paymentMethod');
		logger.log(payment.token.paymentMethod);

		logger.log('paymentRequest.lineItems');
		logger.log(paymentRequest.lineItems);
	}

	var locale = 'en_US';
	const acceptLanguage = req.headers['accept-language'];
	if (acceptLanguage) {
		const pairs = acceptLanguage.split(',');
		if (pairs.length > 0) locale = pairs[0].split(';')[0];
	}

	// Construct an order from the shopping cart and payment information
	const order = orderBuilder.create(paymentRequest.currencyCode, locale);
	const orderDate = order.order_info.order_date;
	const orderNumber = order.order_info.order_number;
	const isBopis = shippingMethod.label == 'Pick Up In Store';

	// Construct values that appear in multiple places
	const address = {
		street_1: shippingContact.addressLines[0] || 'Street',
		street_2: shippingContact.addressLines[1] || '',
		city: shippingContact.locality,
		state: shippingContact.administrativeArea,
		zip: shippingContact.postalCode,
		country: shippingContact.countryCode
	};
	const customer = {
		address,
		email: shippingContact.emailAddress,
		first_name: shippingContact.givenName,
		last_name: shippingContact.familyName,
		phone: shippingContact.phoneNumber,
	};
	const amount = parseFloat(paymentRequest.total.amount);
	const shippingAmount = parseFloat(shippingMethod.amount);

	// Populate Narvar order information
	orderBuilder.setCustomer(order, customer)
		.setBilling(order, {
			billed_to: address,
			amount,
			tax_rate: 0,
			tax_amount: 0,
			shipping_handling: shippingAmount,
			payments: [{
				card: payment.token.paymentMethod.displayName,
				merchant: payment.token.paymentMethod.network,
				is_gift_card: false,
				amount,
			}]
		});

	let trackingNumber = '';
	let pickupId = '';

	const item = {
		sku: 'ABC123',
		name: 'Snazzy Skis',
		quantity: 1,
		unit_price: 8.99,
		item_image: 'https://test-retailer.narvar.qa/images/skis.png',
		item_url: 'https://test-retailer.narvar.qa/'
	};

	if (isBopis) {
		item.fulfilment_type = 'BOPIS';
		item.fulfillment_status = 'NOT_PICKED_UP';
		orderBuilder
			.addItem(order, item)
			.addPickup(order, {
				type: 'BOPIS'
			}, {
				sku: 'ABC123',
				quantity: 1
			});
		pickupId = order.order_info.pickups[0].id;
	} else {
		item.fulfillment_status = 'NOT_SHIPPED';
		orderBuilder
			.addItem(order, item)
			.addShipment(order, {
				shipped_to: customer,
				ship_total: shippingAmount
			}, {
				sku: 'ABC123',
				quantity: 1
			});

		trackingNumber = order.order_info.shipments[0].tracking_number;
	}

	// Post the order to Narvar and get order details for Apple Wallet integration
	return ordersApi.postOrder(order)
		.then(() => {
			ordersApi.getOrderDetails(order)
				.then((orderDetails) => {
					res.send({ orderNumber, trackingNumber, pickupId, orderDetails, orderDate });
				})
				.catch((err) => {
					logger.error('Error getting order details');
					logger.log(err);
					res.status(500).send(err);
				});
		})
		.catch((err) => {
			logger.error('Error posting the order');
			logger.log(err);
			res.status(500).send(err);
		});
});

const carrierEventTypes = {
	"packaged": {
		carrierStatusCode: "PK",
		message: "Packaged",
		narvarStatusCode: "200",
	},
	"pickedUp": {
		carrierStatusCode: "PU",
		message: "Picked up",
		narvarStatusCode: "300",
	},
	"outForDelivery": {
		carrierStatusCode: "LM",
		message: "Out for delivery",
		narvarStatusCode: "400",
	},
	"delivered": {
		carrierStatusCode: "DL",
		message: "Delivered",
		narvarStatusCode: "500",
	},
}

app.post('/carrierEvent/:carrierEventType', function (req, res) {
	const trackingNumber = req.body.trackingNumber;
	if (!trackingNumber.startsWith(config.carrier.trackingNumberPrefix)) {
		return badRequest("Invalid tracking number");
	}
	const { carrierEventType } = req.params;
	const typeMetadata = carrierEventTypes[carrierEventType];
	if (!typeMetadata) {
		return badRequest("Invalid carrier event type");
	}
	const {
		carrierStatusCode,
		message,
		narvarStatusCode,
	} = typeMetadata;
	const carrierData = carrierDataBuilder.create(trackingNumber, carrierStatusCode, message, narvarStatusCode);
	return carrierDataIngestion.carrierEvent(carrierData).then(() => { res.sendStatus(200); });
	
});

const pickupEvents = {
	processing: {
		code: 'PROCESSING',
		details: 'Your order is being processed',
	},
	readyForPickup: {
		code: 'READY_FOR_PICKUP',
		details: 'Your order is ready for pickup at the store',
	},
	pickedUp: {
		code: 'PICKED_UP',
		details: 'Order picked up by customer',
	},
};

app.post('/updatePickup/:eventType', function (req, res) {
	let { eventType } = req.params;
	const eventMetadata = pickupEvents[eventType];
	if (!eventMetadata) {
		return badRequest(res, "Invalid pickup event type");
	}
	const { pickupId, orderNumber, orderDate } = req.body;
	if (!pickupId || !pickupId.startsWith(config.merchant.pickupIdPrefix)) {
		return badRequest(res, "Invalid pickup id");
	}
	if (!orderNumber || !orderNumber.startsWith(config.merchant.orderNumberPrefix)) {
		return badRequest(res, "Invalid order number");
	}
	const order = orderBuilder.update(orderNumber, orderDate);
	const now = new Date().getTime();
	const item = {
		sku: 'ABC123',
		quantity: 1,
		fulfillment_status: eventType,
		fulfilment_type: "BOPIS",
	};
	
	const pickup = {
		id: pickupId,
		status: {
			code: eventMetadata.code,
			message: eventMetadata.details,
			date: new Date(now).toISOString(),
		},
		pickup_by_date: new Date(now + 3 * DAY_TO_MS).toISOString(),
	};
	if (eventType === "PROCESSING") {
		pickup.eta = new Date(now + 30 * MIN_TO_MS).toISOString();
	} else {
		pickup.eta = new Date(now).toISOString();
	}
	orderBuilder
		.addItem(order, item)
		.addPickup(order, pickup, {
			sku: 'ABC123',
			quantity: 1
		});
	return ordersApi.updateOrder(order, orderNumber).then(() => { res.sendStatus(200); });
});


function badRequest(res, message) {
	res.status(400).send({
		status: "Bad Request",
		message,
	});
	return;
}

if (config.environment === "dev") {
	app.get('/sampleOrder', function (req, res) {
		res.send({
			"paymentRequest": {
				"currencyCode": "USD",
				"lineItems": [
					{
						"label": "Pick Up In Store",
						"amount": 12.34
					}
				],
				"total": {
					"amount": 23.45
		
				}
			},
			"payment": {
				"shippingContact": {
					"addressLines": [
						"111 Bridge St"
					],
					"locality": "Chattanooga",
					"administrativeArea": "TN",
					"postalCode": "37407",
					"countryCode": "US",
					"emailAddress": "foo@narvar.com",
					"phoneNumber": "+14238182222",
					"givenName": "Todd",
					"familyName": "Hollandsworth"
				},
				"token": {
					"paymentMethod": {
						"displayName": "1234",
						"network": "VISA"
					}
				}
			}
		});
	});
}

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