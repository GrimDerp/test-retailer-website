'use strict';

const config = {
    storeName: 'Narvar Test Store',
    port: 4567,
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
        enabled: true,
        certFile: './certificates/ssl_cert.pem',
        keyFile: './certificates/ssl_key.pem',
    }
};

const env = process.env;
const environment = env.NODE_ENV || 'dev';

if (environment !== 'dev') {
    config.merchant.identificationCertFile = env.MERCHANT_IDENTIFICATION_CERT_FILE || config.merchant.identificationCertFile;
    config.applePay.paymentProcessingCertFile = env.PAYMENT_PROCESSING_CERT_FILE || config.applePay.paymentProcessingCertFile;
    config.ssl.enabled = false;
}

if (environment.startsWith('prod')) {
    config.narvar.ordersApiUrl = 'https://ws.narvar.com/v1/orders';
}

module.exports = config;
