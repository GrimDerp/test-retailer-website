function getApplePaySession(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/getApplePaySession');
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
      xhr.send(JSON.stringify({url: url}));
    });
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

function processPayment(payment) {
    console.log("processPayment");
    console.log(applePay);
    console.log(payment);

    // Call a payment provider with payment details and
    // finalize the payment transaction
    const paymentToken = "P_" + uuidv4();

    // If payment was success, then create an order from the cart contents
    return createOrder(paymentToken, "8.99");
}

function createOrder(paymentToken, amount) {
    const orderNumber = "O_" + uuidv4();
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/completeOrder');
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                alert(xhr.response);
                window.location.href = "/success.html";
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
        xhr.send(JSON.stringify({ 
            orderNumber: orderNumber, 
            paymentToken: paymentToken,
            amount: amount
        }));
    });
}

