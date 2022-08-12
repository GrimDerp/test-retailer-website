'use strict';

const { v4: uuid } = require('uuid');
const config = require('./config');

const create = function(currency, locale) {
	const orderInfo = { 
        order_info: {
		    order_number: 'test_retailer_order_' + uuid.v4(),
            order_date: new Date().toISOString(),
            currency_code: currency,
            chekcout_locale: locale,
            order_items: [],
            shipments: [],
            pickups: [],
            billing: {},
            customer: {},
            promotions: [],
            attributes: {}
        }
	}
    return orderInfo;
}

const setCustomer = function(order, customer) {
    order.order_info.customer = Object.assign(order.order_info.customer, customer);
    return module.exports;
}

const setBilling = function(order, billing) {
    order.order_info.billing = Object.assign(order.order_info.billing, billing);
    return module.exports;
}

const setAttributes = function(order, attributes) {
    order.order_info.attributes = Object.assign(order.order_info.attributes, attributes);
    return module.exports;
}

const addItem = function(order, item) {
    order.order_info.order_items.push(item);
    return module.exports;
}

const addShipment = function(order, shipment, item) {
    const now = new Date().getTime();
    order.order_info.shipments.push(
        Object.assign({
            tracking_number: 'test_retailer_tracking_' + uuid.v4(),
            carrier: config.carrier.carrierMoniker,
            ship_source: 'DC',
            ship_date: new Date(now + 3 * 60 * 60 * 1000).toISOString(),
            promise_date: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
            items_info: [{
                quantity: item.quantity,
                sku: item.sku
            }]
    }, shipment));
    return module.exports;
}

const addPickup = function(order, pickup, item) {
    const now = new Date().getTime();
    order.order_info.pickups.push(
        Object.assign({
            id: 'test_retailer_pickup_' + uuid.v4(),
            type: 'BOPIS',
            status: {
                code: 'NOT_PICKED_UP',
                message: "Items are being prepared",
                date: new Date(now).toISOString()
            },
            eta: new Date(now + 30 * 60 * 60 * 1000).toISOString(),
            pickup_by_date: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
            items_info: [{
                quantity: item.quantity,
                sku: item.sku
            }],
            store: {
                id: 'Store_0001',
                name: 'Central Boulevard',
                address: {
                    store_area: '50 Beale St',
                    street_1: '',
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94105',
                    country: 'US'
                },
                url: 'https://narvar.com/',
                phone_number: '(888) 777-6666',
                hours: [{
                    open: '0700',
                    close: '2100'
                },{
                    open: '0700',
                    close: '2100'
                },{
                    open: '0700',
                    close: '2100'
                },{
                    open: '0700',
                    close: '2100'
                },{
                    open: '0700',
                    close: '2100'
                },{
                    open: '0700',
                    close: '2100'
                },{
                    open: '0700',
                    close: '2100'
                }]
            }
    }, pickup));
    return module.exports;
}

module.exports = {
    create,
    setCustomer,
    setBilling,
    setAttributes,
    addItem,
    addShipment,
    addPickup
}