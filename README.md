# Apple Pay on the Web demo using Node

Site adapted from [EmporiumWeb](https://developer.apple.com/library/content/samplecode/EmporiumWeb/Introduction/Intro.html)

## Requirements:

* iOS 10 device that supports ApplePay (has TouchID or is an Apple Watch)
* macOS Sierra computer that supports Handoff (mid 2012 or newer, requires Bluetooth LE support)
* Development can be largely done even with an OS version below Sierra and without Handoff support, though testing on it won't work.
* Apple developer account
* Git, Node and NPM installed

## Development environment setup

### Get your Merchant Identity Certificate

Request your Merchant Identity Certificate by logging into your [Apple Developer Site](https://developer.apple.com) and going to
your Merchant ID and clicking "Create Certificate" under "Merchant Identity Certificate" and following the instructions. After you have
the certificate, follow these instructions to convert it to .PEM format and place it in the `certificates` folder.

#### Convert your Merchant Identity Certificate (.CER) to .PEM format

See this [link](http://stackoverflow.com/questions/21250510/generate-pem-file-used-to-setup-apple-push-notification) on SO

Ignore all the stuff about push certificates, this works for converting our Merchant Identity Certificate as well.

1. Import the .cer into Keychain app on your Mac, then export both the certificate and private key as a 
single `applePayCert.p12` file, then run:

```shell
openssl pkcs12 -in applePayCert.p12 -out applePayCert.pem -nodes -clcerts
```

2. Put the `applePayCert.pem` file in `/certificates` folder

### Set up a domain

Choose a domain name that you will use, and map it to 127.0.0.1 in your hosts file. For
the remainder of this readme I will assume that you chose `test-retailer.narvar.qa`.

Next, follow the instructions [here](https://developer.apple.com/reference/applepayjs/) to validate
your merchant domain. Apple will provide a file with which to perform the validation.

Place the file in the `.well-known` folder

### Create a self-signed SSL certificate

Apple Pay only works on websites that are secure. This means that you need to create an SSL
certificate for your chosen domain name and set it to "Trusted" in the Keychain app on your Mac.

## Running Locally

First install all prerequisites by running `npm install`.

Then run `npm run dev` and browse to `https://test-retailer.narvar.qa:4567/` using Safari.

Note that the Apple Pay button does not work in Chrome or any other browser except Safari, 
and only works when running on Apple hardware.
* From Safari on an iOS 10 device with ApplePay support
* From Safari on a Mac running macOS Sierra that [supports Handoff](https://support.apple.com/kb/PH25169?locale=en_US) (2012 and later hardware)

## Apple Resources

* [Apple Pay Developer Site](https://developer.apple.com/apple-pay/)
* [Apple Pay on the web WWDC Session Video](https://developer.apple.com/videos/play/wwdc2016/703/)
* [Apple Pay Domain Verification](https://developer.apple.com/support/apple-pay-domain-verification/)
