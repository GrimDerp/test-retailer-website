const { createApp } = Vue;

createApp({
    data() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            orderNumber: urlParams.get('o'),
            trackingNumber: urlParams.get('t')
        }
    },
    methods: {
        toClipboard(text) {
            navigator.clipboard.writeText(this.orderNumber);
            alert(text + ' copied to clipboard');
        },
        copyOrderNumber() { this.toClipboard(this.orderNumber); },
        copyTrackingNumber() { this.toClipboard(this.trackingNumber); },
        trackingEvent(eventType) { sendTrackingEvent(this.trackingNumber, eventType); }
    }
}).mount('#tracking');
