'use strict';

const { v4: uuid } = require('uuid');
const config = require('./config');

const create = function(cart) {
	return {
		retailer: config.merchant.retailerMoniker,
		orderNumber: uuid.v4()
	}
}

module.exports = {
    create
}