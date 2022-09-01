const cart = createApp({
    data() {
        return {
            cartData,
            shippingMethods,
            shippingMethodsVisible: false,
            minimizeShipments: true
        }
    },
    methods: {
        toCurrency(value) {
            return currencyFormat.format(value);
        },
        openShippingMethods() {
            console.log('openShippingMethods');
            this.shippingMethodsVisible = true;
        },
        selectShippingMethod(method) {
            console.log('selectShippingMethod ' + method.label);
            this.cartData.shipping = method;
            this.cartData.recalculate();
            this.shippingMethodsVisible = false;
        },
        quantityChanged(item, quantity) {
            if (quantity >= 0) {
                item.quantity = quantity;
                this.cartData.recalculate();
            }
        }
    }
});
