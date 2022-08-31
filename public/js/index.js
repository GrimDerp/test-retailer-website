const merchantName = 'Narvar';
const countryCode = 'US';
const currencyCode = 'USD';
const supportedNetworks = [ 'amex', 'discover', 'masterCard', 'visa'];
const merchantCapabilities = [ 'supports3DS' ];
const requiredShippingContactFields = [ 'postalAddress', 'phone', 'email' ];
const productCatalog = [
	{
		label: 'Snazzy Skis',
		amount: 8.99,
		identifier: 'SNOW001',
		detail: '',
		imageUrl: 'images/skis.png',
	},
	{
		label: 'Purrfect Poles',
		amount: 11.49,
		identifier: 'SNOW002',
		detail: '',
		imageUrl: 'images/poles.png',
	},
];
const shippingMethods = [
	{
		label: 'Standard Shipping',
		amount: 5.00,
		identifier: 'standard',
		detail: 'Delivers in five business days',
	},
	{
		label: 'Express Shipping',
		amount: 15.00,
		identifier: 'express',
		detail: 'Delivers in two business days',
	},
	{
		label: 'Pick Up In Store',
		amount: 0.00,
		identifier: 'bopis',
		detail: 'Pick it up today from your nearest store',
	},
];
const cartData = {
	items: [{
		product: productCatalog[0],
		quantity: 1,
		totalAmount: productCatalog[0].amount
	}, {
		product: productCatalog[1],
		quantity: 1,
		totalAmount: productCatalog[1].amount
	}],
	shipping: shippingMethods[0],
	total: productCatalog[0].amount + productCatalog[1].amount + shippingMethods[0].amount
}
