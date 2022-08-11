'use strict';

const { v4: uuid } = require('uuid');
const config = require('./config');

const create = function(currency, locale) {
	const orderInfo = { 
        order_info: {
		    order_number: uuid.v4(),
            order_date: new Date().toISOString(),
            currency_code: currency,
            chekcout_locale: locale,
            order_items: [],
            shipments: [],
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
}

const addItem = function(order, item) {
    order.order_info.order_items.push(item);
}

module.exports = {
    create,
    setCustomer,
    addItem
}