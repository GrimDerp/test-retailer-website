const applePayButton = createApp({
    data() {
        return {
            applePayAvailable: ApplePaySession && ApplePaySession.canMakePayments,
        }
    },
    methods: {
        pay() {
            console.log('applePayButtonClicked');

            const currencyFormat = new Intl.NumberFormat('en-' + countryCode , { 
                style: 'currency', 
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            const formatCurrency = function(amount) {
                return currencyFormat.format(amount).substring(1);
            }

            const paymentRequest = {
                countryCode,
                currencyCode,
                supportedNetworks,
                merchantCapabilities,
                requiredShippingContactFields,
                lineItems: [],
                total: { label: merchantName }
            };
            cartData.items.forEach(function (item) {
                if (item.quantity > 0) {
                    paymentRequest.lineItems.push({
                        label: item.quantity + ' x ' + item.product.label,
                        detail: item.product.detail,
                        identifier: item.product.identifier,
                        amount: formatCurrency(item.totalAmount)
                    });
                }
            });
            paymentRequest.lineItems.push({
                label: cartData.shipping.label,
                detail: cartData.shipping.detail,
                identifier: cartData.shipping.identifier,
                amount: formatCurrency(cartData.shipping.amount)
            });
            paymentRequest.total.amount = formatCurrency(cartData.total);

            const applePayVersion = 1;
            const session = new ApplePaySession(applePayVersion, paymentRequest);

            session.onvalidatemerchant = (event) => {
                console.log('session.onvalidatemerchant');
                callApplePay(event.validationURL).then(function (response) {
                    console.log('Merchant identifier: ' + response.merchantIdentifier);
                    console.log('Domain name: ' + response.domainName);
                    console.log('Display name: ' + response.displayName);
                    session.completeMerchantValidation(response);
                });
            };

            session.onpaymentauthorized = (event) => {
                console.log('session.onpaymentauthorized');

                processPayment(paymentRequest, event.payment)
                    .then((result) => {
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

            session.begin();
        },
    }
});
