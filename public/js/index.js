/*
The main client-side JS. Handles displaying the Apple Pay button and requesting a payment.
*/

const merchantName = 'Narvar';
const countryCode = 'US';
const currencyCode = 'USD';
const supportedNetworks = [ 'amex', 'discover', 'masterCard', 'visa'];
const merchantCapabilities = [ 'supports3DS' ];
const requiredShippingContactFields = [ 'postalAddress', 'phone', 'email' ];
const productCatalog = [
	{
		label: 'Snazzy Skis',
		amount: '8.99',
		identifier: 'ABC123',
		detail: '',
	}
];
const shippingMethods = [
	{
		label: 'Standard Shipping',
		amount: '5.00',
		identifier: 'free',
		detail: 'Delivers in five business days',
	},
	{
		label: 'Express Shipping',
		amount: '15.00',
		identifier: 'express',
		detail: 'Delivers in two business days',
	},
	{
		label: 'Pick Up In Store',
		amount: '0.00',
		identifier: 'bopis',
		detail: 'Pick it up today from your nearest store',
	},
];

document.addEventListener('DOMContentLoaded', () => {
	if (window.ApplePaySession) {
		if (ApplePaySession.canMakePayments) {
			showApplePayButton();
		}
	}
});

function showApplePayButton() {
	HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
	const buttons = document.getElementsByClassName('apple-pay-button');
	for (let button of buttons) {
		button.className += ' visible';
	}
}

function applePayButtonClicked() {
	console.log('applePayButtonClicked');

	const paymentRequest = {
		countryCode,
		currencyCode,
		shippingMethods,
		supportedNetworks,
		merchantCapabilities,
		requiredShippingContactFields,
		lineItems: [],
		total: { label: merchantName }
	};
	paymentRequest.lineItems.push(productCatalog[0]);
	paymentRequest.lineItems.push(shippingMethods[0]);
	paymentRequest.total.amount = '13.99';

	const applePayVersion = 1;
	const session = new ApplePaySession(applePayVersion, paymentRequest);
	
	session.onvalidatemerchant = (event) => {
		console.log('session.onvalidatemerchant');
		callApplePay(event.validationURL).then(function(response) {
  			console.log('Merchant identifier: ' + response.merchantIdentifier);
  			console.log('Domain name: ' + response.domainName);
  			console.log('Display name: ' + response.displayName);
  			session.completeMerchantValidation(response);
		});
	};

	session.onshippingmethodselected = (event) => {
		console.log('session.onshippingmethodselected');
		const shippingMethod = event.shippingMethod.label;
		const shippingCost = event.shippingMethod.amount;
		const totalCost = (8.99 + parseFloat(shippingCost)).toFixed(2);

		const lineItems = [
			productCatalog[0],
			{
				label: shippingMethod,
				amount: shippingCost,
			},
		];

		const total = {
			label: merchantName,
			amount: totalCost,
		};

		paymentRequest.total = total;
		paymentRequest.lineItems = lineItems;

		session.completeShippingMethodSelection(ApplePaySession.STATUS_SUCCESS, total, lineItems);
	};

	// This function is called by Apple Pay when the user chooses a payment 
	// method and authorizes the amount to be charged
	session.onpaymentauthorized = (event) => {
		console.log('session.onpaymentauthorized');

		// Send encrypted payment information for processing.
		// The private key associated with Payment Processing Certificate 
		// must be used to decrypt the response on the server-side
		processPayment(paymentRequest, event.payment)
			.then((result) => {
				// In this case the payment was successful and the order was placed.
				// result.orderDetails contains information on how to retrieve the
				// order details from the order management system and subscribe to 
				// shipping events. In this example Narvar provides these details 
				// to simplify retailer integrations.
				session.completePayment({
					status: ApplePaySession.STATUS_SUCCESS,
					orderDetails: result.orderDetails,
				});
                window.location.href = '/success.html?o=' + result.orderNumber + 
					'&t=' + result.trackingNumber + '&p=' + result.pickupId + "&d=" + result.orderDate;
			})
			.catch((result) => {
				console.log('Error processing order: ' + JSON.stringify(result));
				session.completePayment({
					status: ApplePaySession.STATUS_FAILURE,
					errors: result.errors,
				});
			});
	}

	// All our handlers are setup - start the Apple Pay payment
	session.begin();
}
