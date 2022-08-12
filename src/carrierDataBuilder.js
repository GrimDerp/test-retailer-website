'use strict';

const config = require('./config');

const create = function(trackingNumber, statusCode, statusDesc, narvarStatusCode) {
	const carrierData = { 
        retailer_moniker: config.merchant.retailerMoniker,
        carrier_moniker: config.carrier.carrierMoniker,
        tracking_number: trackingNumber,
        event_datetime_utc: new Date().toISOString(),
        message_origin: 'test-retailer',
        carrier_status_code: statusCode,
        carrier_service_code_desc: statusDesc,
        narvar_event_status_code: narvarStatusCode,
        feed_type: 'API'
	};
    carrierData.event_datetime_raw = carrierData.event_datetime_utc;
    return carrierData;
}

module.exports = {
    create
}