'use strict';

const fs = require('fs');
const config = require('./config');

try {
	fs.accessSync(config.merchant.identificationCertFile);
	fs.accessSync(config.applePay.paymentProcessingCertFile);
	fs.accessSync(config.ssl.certFile);
	fs.accessSync(config.ssl.keyFile);
} catch (e) {
	throw new Error('Some certificate files are missing.\n' + e);
}

module.exports = {
    merchantIdentityCert: fs.readFileSync(config.merchant.identificationCertFile),
    paymentProcessingCert: fs.readFileSync(config.applePay.paymentProcessingCertFile),
    sslKey: fs.readFileSync(config.ssl.keyFile),
    sslCert: fs.readFileSync(config.ssl.certFile),
}