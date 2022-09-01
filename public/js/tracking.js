const tracking = createApp({
    data() {
        const urlParams = new URLSearchParams(window.location.search);
        const data = {
            orderNumber: urlParams.get('o'),
            orderDate: urlParams.get('d'),
            shipments: [],
            pickups: [],
            busy: false,
        }
        if (urlParams.get('t')) 
            urlParams.get('t').split(',').forEach(function(trackingNumber){
                data.shipments.push({
                    trackingNumber,
                    status: 100,
                    statusText: 'not shipped'
                })
            });
        if (urlParams.get('p'))
            urlParams.get('p').split(',').forEach(function(pickupId){
                data.pickups.push({
                    pickupId,
                    status: 100,
                    statusText: 'not picked up'
                })
            });
        return data;
    },
    methods: {
        toClipboard(text) {
            navigator.clipboard.writeText(this.orderNumber);
            alert(text + ' copied to clipboard');
        },
        trackingEvent(shipment, newStatus) {
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
                sendTrackingEvent(shipment.trackingNumber, eventType)
                    .then(() => {
                        shipment.status = newStatus;
                        shipment.statusText = newStatusText;
                        this.busy = false;
                    })
                    .catch(() => { 
                        console.log('Failed to record shipment event');
                        this.busy = false;
                    });
            }
        },
        pickupEvent(pickup, newStatus) {
            let eventType = '';
            let newStatusText = '';
            switch (newStatus) {
                case 300:
                    eventType = 'readyForPickup';
                    newStatusText = 'ready for pickup';
                    break;
                case 400:
                    eventType = 'pickedUp';
                    newStatusText = 'picked up by client';
                    break;
            }
            if (eventType) {
                this.busy = true;
                sendPickupEvent(this.orderNumber, this.orderDate, pickup.pickupId, eventType)
                    .then(() => {
                        pickup.status = newStatus;
                        pickup.statusText = newStatusText;
                        this.busy = false;
                    })
                    .catch(() => { 
                        console.log('Failed to record pickup event');
                        this.busy = false;
                    });
            }
        }
    }
});
