/*
The main client-side JS. Handles displaying the Apple Pay button and requesting a payment.
*/

/**
* This method is called when the page is loaded.
* We use it to show the Apple Pay button as appropriate.
* Here we're using the ApplePaySession.canMakePayments() method,
* which performs a basic hardware check. 
*
* If we wanted more fine-grained control, we could use
* ApplePaySession.canMakePaymentsWithActiveCards() instead.
*/
document.addEventListener('DOMContentLoaded', () => {
	if (window.ApplePaySession) {
		if (ApplePaySession.canMakePayments) {
			showApplePayButton();
		}
	}
});

function showApplePayButton() {
	HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
	const buttons = document.getElementsByClassName("apple-pay-button");
	for (let button of buttons) {
		button.className += " visible";
	}
}


/**
* Apple Pay Logic
* Our entry point for Apple Pay interactions.
* Triggered when the Apple Pay button is pressed
*/
function applePayButtonClicked() {
	console.log("applePayButtonClicked");
	const paymentRequest = {
		countryCode: 'US',
		currencyCode: 'USD',
		shippingMethods: [
			{
				label: 'Free Shipping',
				amount: '0.00',
				identifier: 'free',
				detail: 'Delivers in five business days',
			},
			{
				label: 'Express Shipping',
				amount: '5.00',
				identifier: 'express',
				detail: 'Delivers in two business days',
			},
		],

		lineItems: [
			{
				label: 'Shipping',
				amount: '0.00',
			}
		],

		total: {
			label: 'Apple Pay Example',
			amount: '8.99',
		},

		supportedNetworks:[ 'amex', 'discover', 'masterCard', 'visa'],
		merchantCapabilities: [ 'supports3DS' ],

		requiredShippingContactFields: [ 'postalAddress', 'email' ],
	};

	const session = new ApplePaySession(1, paymentRequest);
	
	session.onvalidatemerchant = (event) => {
		console.log("session.onvalidatemerchant");
		const validationURL = event.validationURL;
		getApplePaySession(event.validationURL).then(function(response) {
  			console.log(response);
  			session.completeMerchantValidation(response);
		});
	};

	session.onshippingmethodselected = (event) => {
		console.log("session.onshippingmethodselected");
		const shippingCost = event.shippingMethod.identifier === 'free' ? '0.00' : '5.00';
		const totalCost = event.shippingMethod.identifier === 'free' ? '8.99' : '13.99';

		const lineItems = [
			{
				label: 'Shipping',
				amount: shippingCost,
			},
		];

		const total = {
			label: 'Apple Pay Example',
			amount: totalCost,
		};

		session.completeShippingMethodSelection(ApplePaySession.STATUS_SUCCESS, total, lineItems);
	};

	session.onpaymentauthorized = (event) => {
		console.log("session.onpaymentauthorized");

		// Send encrypted payment information for processing.
		// The private key associated with Payment Processing Certificate 
		// must be used to decrypt the response on the server-side
		processPayment(event.payment);

		// Return a status and redirect to a confirmation page
		session.completePayment(ApplePaySession.STATUS_SUCCESS);
	}

	// All our handlers are setup - start the Apple Pay payment
	session.begin();
}
