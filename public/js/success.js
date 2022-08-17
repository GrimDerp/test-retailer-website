const { createApp } = Vue;

createApp({
    data() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            orderNumber: urlParams.get('o'),
            trackingNumber: urlParams.get('t'),
            pickupNumber: urlParams.get('p'),
            orderStatus: 100,
            orderStatusText: 'placed',
            busy: false,
        }
    },
    methods: {
        toClipboard(text) {
            navigator.clipboard.writeText(this.orderNumber);
            alert(text + ' copied to clipboard');
        },
        copyOrderNumber() { this.toClipboard(this.orderNumber); },
        copyTrackingNumber() { this.toClipboard(this.trackingNumber); },
        copyPickupNumber() { this.toClipboard(this.pickupNumber); },
        trackingEvent(newStatus) {
            let eventType = '';
            let newStatusText = '';
            switch (newStatus) {
                case 200:
                    eventType = 'packaged';
                    newStatusText = 'ready for pickup';
                    break;
                case 300:
                    eventType = 'pickedUp';
                    newStatusText = 'picked up';
                    break;
                case 400:
                    eventType = 'outForDelivery';
                    newStatusText = 'out for delivery';
                    break;
                case 500:
                    eventType = 'delivered';
                    newStatusText = 'delivered';
                    break;
            }
            if (eventType) {
                this.busy = true;
                sendTrackingEvent(this.trackingNumber, eventType)
                    .then(() => {
                        this.orderStatus = newStatus;
                        this.orderStatusText = newStatusText;
                        this.busy = false;
                    })
                    .catch(() => { 
                        this.busy = false;
                    });
            }
        }
    }
}).mount('#tracking');
