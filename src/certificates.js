'use strict';

const fs = require('fs');
const config = require('./config');
const logger = require('./logger');

const loadCert = function(name, fileName) {
	try {
		fs.accessSync(fileName);
	} catch (e) {
		logger.error(e);
		logger.error('No access to ' + name + ' in ' + fileName);
		return null;
	}
	const cert = fs.readFileSync(fileName);
	logger.log('Loaded ' + name + ' from ' + fileName);
	return cert;
}

var merchantIdentityCert = undefined;
var appleWWDRCert = undefined;
var paymentProcessingCert = undefined;
var sslKey = undefined;
var sslCert = undefined;

module.exports = {
    getMerchantIdentityCert: function(){
		if (merchantIdentityCert === undefined)
			merchantIdentityCert = loadCert('merchant identification certificate', config.merchant.identificationCertFile);
		return merchantIdentityCert;
	},
    getAppleWWDRCert: function(){
		if (appleWWDRCert === undefined)
			appleWWDRCert = loadCert('Apple WWDR certificate', config.applePay.wwdrCertFile);
		return appleWWDRCert;
	},
    getPaymentProcessingCert: function(){
		if (paymentProcessingCert === undefined)
			paymentProcessingCert = loadCert('payment processing certificate', config.applePay.paymentProcessingCertFile);
		return paymentProcessingCert;
	},
    getSSLKey: function(){
		if (sslKey === undefined)
			sslKey = loadCert('SSL private key', config.ssl.keyFile);
		return sslKey;
	},
    getSSLCert: function(){
		if (sslCert === undefined)
			sslCert = loadCert('SSL certificate', config.ssl.certFile);
		return sslCert;
	},
}