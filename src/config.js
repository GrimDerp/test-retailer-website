'use strict';

const config = {
    storeName: 'Narvar Test Store',
    port: 4567,
    narvar: {
        ordersApiUrl: 'https://ws.narvar.qa/api/v1/orders',
        cdiUrl: 'https://ws.narvar.qa/api/v1/carrier-data',
        authToken: Buffer.from('a9220678931f4226a3fb81015189a8f9:3ce11e0bb61541f9a6e25fd629aca4f3').toString('base64'),
    },
    merchant: {
        retailerMoniker: 'peninsula_interaction',
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
        enabled: (process.env.SSL_ENABLED !== "false"),
        certFile: './certificates/ssl_cert.pem',
        keyFile: './certificates/ssl_key.pem',
    },
    featureFlags: {
        logPaymentDetails: true,
        logSuccess: true,
    }
};

const env = process.env;
const environment = env.NODE_ENV || 'dev';

config.environment = environment;

if (environment !== 'dev') {
    config.merchant.identificationCertFile = env.MERCHANT_IDENTIFICATION_CERT_FILE || config.merchant.identificationCertFile;
    config.applePay.paymentProcessingCertFile = env.PAYMENT_PROCESSING_CERT_FILE || config.applePay.paymentProcessingCertFile;
    config.ssl.enabled = false;
    config.featureFlags.logPaymentDetails = false;
    config.featureFlags.logSuccess = false;
}

if (environment.startsWith('prod')) {
    config.narvar.ordersApiUrl = 'https://ws.narvar.com/v1/orders';
    config.featureFlags.logPaymentDetails = false; // DO NOT CHANGE THIS TO TRUE UNDER ANY CIRCUMSTANCES
}

module.exports = config;
