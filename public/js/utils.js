const { createApp } = Vue;

const merchantName = 'Narvar';
const countryCode = 'US';
const currencyCode = 'USD';
const supportedNetworks = [ 'amex', 'discover', 'masterCard', 'visa'];
const merchantCapabilities = [ 'supports3DS' ];
const requiredShippingContactFields = [ 'postalAddress', 'phone', 'email' ];

const currencyFormat = new Intl.NumberFormat('en-' + countryCode , { 
    style: 'currency', 
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

// Makes a call to the Apple Pay servers via the retailer back-end
// so that Apple can tell that the request is genuinely from this
// retailer. The back-end srver will establish a mTLS connection to
// Apple servers to forward this request
function callApplePay(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/proxyApplePay');
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({ url: url }));
    });
}

// Generates a random globally unique identifier
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// This function is passed payment information (for example credit card details)
// and should use these details to pay for the order. Since this is a demo website
// the payment a;ways succeeds without charging the card
function processPayment(paymentRequest, payment) {
    console.log("processPayment");
    console.log(paymentRequest);
    console.log(payment);

    // Call a payment provider with payment details and
    // finalize charge this order to the customer's card

    // If payment was success, then create an order from the cart contents
    return createOrder(paymentRequest, payment);
}

// Following a successful response from the payment provider, the credit card
// has been changed and it is time to convert the cart into an order.
function createOrder(paymentRequest, payment) {
    console.log("createOrder");
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/completeOrder');
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                if (this.response.errors) {
                    reject({
                        status: this.status,
                        errors: this.response.errors,
                    });
                } else {
                    resolve({
                        status: this.status,
                        orderNumber: this.response.orderNumber,
                        orderDate: this.response.orderDate,
                        trackingNumber: this.response.trackingNumber,
                        pickupId: this.response.pickupId,
                        orderDetails: this.response.orderDetails
                    });
                }
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.responseType = 'json';
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ paymentRequest, payment }));
    });
}

function sendTrackingEvent(trackingNumber, eventType) {
  console.log("sendTrackingEvent " + trackingNumber + " " + eventType);
  return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/carrierEvent/' + eventType);
      xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) {
              resolve({ 
                status: this.status
              });
          } else {
              reject({
                  status: this.status,
                  statusText: xhr.statusText
              });
          }
      };
      xhr.onerror = function () {
          reject({
              status: this.status,
              statusText: xhr.statusText
          });
      };
      xhr.responseType = 'json';
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({ trackingNumber }));
  });
}

function sendPickupEvent(orderNumber, orderDate, pickupId, eventType) {
    console.log("[sendPickupEvent] orderNumber: " + orderNumber + ", pickupId: " + pickupId + ", eventType: " + eventType);
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/updatePickup/' + eventType);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve({ 
                  status: this.status
                });
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.responseType = 'json';
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ pickupId, orderNumber, orderDate }));
    });
  }
