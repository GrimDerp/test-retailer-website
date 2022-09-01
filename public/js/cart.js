const cart = createApp({
    data() {
        return {
            cartData
        }
    },
    methods: {
        toCurrency(value) {
            return currencyFormat.format(value);
        },
        quantityChanged(item, quantity) {
            if (quantity >= 0) {
                item.quantity = quantity;
                cartData.recalculate();
            }
        }
    }
});
