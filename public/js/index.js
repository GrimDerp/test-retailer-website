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

	const applePayVersion = 1;
	const session = new ApplePaySession(applePayVersion, paymentRequest);
	
	session.onvalidatemerchant = (event) => {
		console.log("session.onvalidatemerchant");
		callApplePay(event.validationURL).then(function(response) {
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

	// This function is called by Apple Pay when the user chooses a payment 
	// method and authorizes the amount to be charged
	session.onpaymentauthorized = (event) => {
		console.log("session.onpaymentauthorized");

		// Send encrypted payment information for processing.
		// The private key associated with Payment Processing Certificate 
		// must be used to decrypt the response on the server-side
		processPayment(session.paymentRequest, event.payment)
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
                window.location.href = "/success.html";
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
