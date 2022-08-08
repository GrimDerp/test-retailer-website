'use strict';

const config = {
    storeName: 'Narvar Test Store',
    narvar: {
        ordersApiUrl: 'https://ws.narvar.qa/v1/orders',
        authToken: '<base64 encoded retailer credentials>',
    },
    merchant: {
        retailerMoniker: 'peninsular_interaction',
        identifier: 'merchant.pass.com.narvar.walletintegration.test',
        domain: 'test-retailer.narvar.qa',
        identificationCertFile: './certificates/merchantIdentity.pem'
    },
    applePay: {
        paymentProcessingCertFile: './certificates/paymentProcessing.pem',
    },
    ssl: {
        certFile: './certificates/ssl_cert.pem',
        keyFile: './certificates/ssl_key.pem',
        port: 4567
    }
};

const env = process.env;
const environment = env.NODE_ENV || 'dev';

if (environment !== 'dev') {
    config.merchant.identificationCertFile = env.MERCHANT_IDENTIFICATION_CERT_FILE;
    config.applePay.paymentProcessingCertFile = env.PAYMENT_PROCESSING_CERT_FILE;
    config.ssl.certFile = env.SSL_CERT_FILE;
    config.ssl.keyFile = env.SSL_KEY_FILE;
    config.ssl.port = 443;
}

if (environment.startsWith('prod')) {
    config.narvar.ordersApiUrl = 'https://ws.narvar.com/v1/orders';
}

module.exports = config;
