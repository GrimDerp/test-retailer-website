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
	const buttons = document.getElementsByClassName('apple-pay-button');
	for (let button of buttons) {
		button.className += ' visible';
	}
}

/**
* Apple Pay Logic
* Our entry point for Apple Pay interactions.
* Triggered when the Apple Pay button is pressed
*/
function applePayButtonClicked() {
	console.log('applePayButtonClicked');
	const paymentRequest = {
		countryCode: 'US',
		currencyCode: 'USD',
		shippingMethods: [
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
		],

		lineItems: [
			{
				label: 'Standard Shipping',
				amount: '5.00',
			}
		],

		total: {
			label: 'Test Order',
			amount: '13.99',
		},

		supportedNetworks:[ 'amex', 'discover', 'masterCard', 'visa'],
		merchantCapabilities: [ 'supports3DS' ],

		requiredShippingContactFields: [ 'postalAddress', 'phone', 'email' ],
	};

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
			{
				label: shippingMethod,
				amount: shippingCost,
			},
		];

		const total = {
			label: 'Apple Pay Example',
			amount: totalCost,
		};

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
                window.location.href = '/success.html?o=' + result.orderNumber + '&t=' + result.trackingNumber;
			})
			.catch((result) => {
				if (result.errors) {
					// In this case the payment request was rejected by payment provider
					// For example name or address does not match the card provider information
					// result.errors must be an array of ApplePayError objects
					session.completePayment({
						status: ApplePaySession.STATUS_FAILURE,
						errors: result.errors,
					});
				} else {
					// In this case something else went wrong - network error, service down etc
					throw result;
				}
			});
	}

	// All our handlers are setup - start the Apple Pay payment
	session.begin();
}
