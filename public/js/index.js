const productCatalog = [
	{
		label: 'Snazzy Skis',
		price: 8.99,
		identifier: 'SNOW001',
		detail: 'Slick, smooth snazzi skiis will have you whizzing down the slopes in style',
		imageUrl: 'images/skis.png',
		color: "White",
		size: "Medium"
	},
	{
		label: 'Purfect Poles',
		price: 11.49,
		identifier: 'SNOW002',
		detail: 'These are the purfect ski poles to get you noticed in all the best places',
		imageUrl: 'images/poles.png',
		color: "White",
		size: "Medium"
	},
];
const shippingMethods = [
	{
		label: 'Standard Shipping',
		price: 5.00,
		identifier: 'standard',
		detail: 'Delivers in five business days',
	},
	{
		label: 'Express Shipping',
		price: 15.00,
		identifier: 'express',
		detail: 'Delivers in two business days',
	},
	{
		label: 'Pick Up In Store',
		price: 0.00,
		identifier: 'bopis',
		detail: 'Pick it up today from your nearest store',
	},
];
const cartData = {
	items: [{
		product: productCatalog[0],
		quantity: 1,
		total: 0,
	}, {
		product: productCatalog[1],
		quantity: 1,
		total: 0,
	}],
	shipping: shippingMethods[0],
	total: 0,

	recalculate: function() {
		let subTotal = 0;
		this.items.forEach(function(item){
			item.total = item.quantity * item.product.price;
			subTotal += item.total;
		}); 
		this.total = subTotal + this.shipping.price;
		console.log('New cart total: ' + this.total.toFixed(2));
	}
}
cartData.recalculate();
