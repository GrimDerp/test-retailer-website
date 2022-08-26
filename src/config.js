'use strict';

const env = process.env;
const environment = env.NODE_ENV || 'dev';

const config = {
    environment,
    storeName: 'Narvar Test Store',
    port: 4567,
    narvar: {
        ordersApiUrl: 'https://ws.narvar.qa/api/v1/orders',
        cdiUrl: 'https://ws.narvar.qa/api/v1/carrier-data',
    },
    merchant: {
        retailerMoniker: 'peninsula_interaction',
        authToken: Buffer.from('a9220678931f4226a3fb81015189a8f9:3ce11e0bb61541f9a6e25fd629aca4f3').toString('base64'),
        identifier: 'merchant.pass.com.narvar.walletintegration.test',
        domain: 'test-retailer.narvar.qa',
        identificationCertFile: './certificates/merchantIdentity.pem',
        orderNumberPrefix: 'test_retailer_order_',
        pickupIdPrefix: 'test_retailer_pickup_',
        customerIdPrefix: 'c_',
    },
    carrier: {
        carrierMoniker: 'dhl',
        trackingNumberPrefix: 'test_retailer_track_',
    },
    applePay: {
        wwdrCertFile: './certificates/AppleWWDRCAG3.cer',
        paymentProcessingCertFile: './certificates/paymentProcessing.pem',
    },
    ssl: {
        enabled: true,
        certFile: './certificates/ssl_cert.pem',
        keyFile: './certificates/ssl_key.pem',
    },
    featureFlags: {
        logPaymentDetails: true,
        logSuccess: true,
    }
};

if (environment !== 'dev') {
    config.merchant.identificationCertFile = env.MERCHANT_IDENTIFICATION_CERT_FILE || config.merchant.identificationCertFile;
    config.applePay.paymentProcessingCertFile = env.PAYMENT_PROCESSING_CERT_FILE || config.applePay.paymentProcessingCertFile;
    config.ssl.enabled = false;
    config.featureFlags.logPaymentDetails = false; // DO NOT CHANGE THIS TO TRUE UNDER ANY CIRCUMSTANCES
    config.featureFlags.logSuccess = false;
}

if (environment.startsWith('prod')) {
    config.narvar.ordersApiUrl = 'https://ws.narvar.com/api/v1/orders';
    config.narvar.cdiUrl = 'https://ws.narvar.com/api/v1/carrier-data';
}

if (env.SSL_ENABLED !== undefined)
    config.ssl.enabled = !!env.SSL_ENABLED;

module.exports = config;
