# Narvar Apple Pay integration demo using Node
Site adapted from [EmporiumWeb](https://developer.apple.com/library/content/samplecode/EmporiumWeb/Introduction/Intro.html)

## Requirements:
* iOS 10 device that supports ApplePay (has TouchID or is an Apple Watch)
* macOS Sierra computer that supports Handoff (mid 2012 or newer, requires Bluetooth LE support)
* Development can be largely done even with an OS version below Sierra and without Handoff support, though testing on it won't work.
* Apple developer account
* Git, Node and NPM installed

## Development environment setup

### Using the Keychain Access app
Your Mac has an application called Keychain Access. This application allows you to manage
the certificates in the keychains on your machine. In particular you can:
* Use the Certificate Assistant to create a certificate request. A public/private key pair is added to your keychain and the pubic key is included in the certificate request.
* Import certificates created by Apple in response to certificate requests. This associates the certificate with the public/private key created by the Certificate Assistant.
* Export a pkcs12 format file that contains the public/private key pair and the certificate.

### Converting certificate (.cer) files to .pem format
To convert the `.cer` files that you will download from Apple into the required `.pem` format, see this 
[link](http://stackoverflow.com/questions/21250510/generate-pem-file-used-to-setup-apple-push-notification) on SO

Ignore all the stuff about push certificates, this works for converting our Merchant Identity Certificate as well.

1. Import the .cer file into Keychain Access app on your Mac, then export both the certificate and private key as a 
single `.p12` file, then run:

```shell
openssl pkcs12 -in <file>.p12 -out <file>.pem -nodes -clcerts
```
2. Put the `.pem` file in `/certificates` folder

### Get a Merchant Identity Certificate
The Merchant Identity Certificate is used to create a secure mTLS connection between your servers and the ApplePay servers.

Request your Merchant Identity Certificate by logging into your [Apple Developer Site](https://developer.apple.com) and going to
your Merchant ID and clicking "Create Certificate" under "Merchant Identity Certificate" and following the instructions. After you have
the certificate, follow the instructions above to convert it to `.pem` format and place it in the `certificates` folder.

Convert your Merchant Identity Certificate `.cer` file to `.pem` format as described above.
The file must be called `merchantIdentityCert.pem` and must be in the `./certificates` folder.

```shell
openssl pkcs12 -in merchantIdentityCert.p12 -out merchantIdentityCert.pem -nodes -clcerts
```

```shell
curl https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer -o AppleWWDRCAG3.cer 
```

### Get a Payment Processing Certificate
The Payment Processing Certificate is used by ApplePay to encrypt responses that it returns 
to your website. Your website must use the private key associated with the certificate to
decrypt those responses before accessing the information that they contain.

Request a Payment Processing Certificate by logging into your [Apple Developer Site](https://developer.apple.com) and going to
your Merchant ID and clicking "Create Certificate" under "Payment Processing Certificate" and following the instructions. After you have
the certificate, follow the instructions above to convert it to .PEM format and place it in the `certificates` folder.

Convert your Payment Processing Certificate `.cer` file to `.pem` format as described above.
The file must be called `paymentProcessing.pem` and must be in the `./certificates` folder.

```shell
openssl pkcs12 -in paymentProcessing.p12 -out paymentProcessing.pem -nodes -clcerts
```

### Set up a verified domain
Choose a domain name that you will use, and map it to 127.0.0.1 in your hosts file. For
the remainder of this readme I will assume that you chose `test-retailer.narvar.qa`.

Next, follow the instructions [here](https://developer.apple.com/reference/applepayjs/) to validate
your merchant domain. Apple will provide a file with which to perform the validation. The
file must be placed in the `.well-known` folder. During the varification step, Apple servers will
try to retieve `https://test-retailer.narvar.qa/.well-known/<filename>.txt` to verify that you own the
domain.

### Create a self-signed SSL certificate
Apple Pay only works on websites that are secure. This means that you need to create an SSL
certificate for your chosen domain name and set it to "Trusted" in the Keychain app on your Mac.
You need to copy the SSL key and certificate files to the `./certificates` folder.

Be sure to set the "common name" of your certificate to the domain name that you chose.

```shell
openssl genrsa -out ssl_key.pem
openssl req -new -key ssl_key.pem -out ssl_csr.pem
openssl x509 -req -days 9999 -in ssl_csr.pem -signkey ssl_key.pem -out ssl_cert.pem
```

Next you need to get Safari to trust the self-signed certificate by adding it to
the keychain on your mac and modifying the trust level.

* Open the Keychain Access app on your Mac and import the `ssl_cert.pem` file.
* Double click on the certificate
* Expand the Trust section and set the certificate to trusted
* To save the changes you will need to enter your password

Now you should be able to run the service and navigate to `https://test-retailer.narvar.qa/`
in the Safari browser and see the index page.

Note: If you want to visit the real test-retailer.narvar.qa then you will have to
comment out the line in your `hosts` file that maps `test-retailer.narvar.qa` to 127.0.0.1.

## Running Locally
First install all prerequisites by running `npm install`.

Then run `npm run dev` and browse to `https://test-retailer.narvar.qa:4567/` using Safari.

Note that the Apple Pay button does not work in Chrome or any other browser except Safari, 
and only works when running on Apple hardware.
* From Safari on an iOS 10 device with ApplePay support
* From Safari on a Mac running macOS Sierra that [supports Handoff](https://support.apple.com/kb/PH25169?locale=en_US) (2012 and later hardware)

## Running in other environments
You can run the application with another environment's config by setting the `NODE_ENV`
environment variable before starting the application, for example

```shell
export NODE_ENV=qa01
export SSL_ENABLED=true
npm run dev
```

## Running in Docker locally
1. Build the application into the dist folder: `npm run build`
2. Build a new docker image: `docker build -t test-retailer-website .`
3. Delete the prior Docker container: `docker rm -f test-retailer-website`
4. Run a new Docker container: `docker run -p 4567:4567 -t --name test-retailer-website test-retailer-website`

## Apple Resources
* [Apple Pay Developer Site](https://developer.apple.com/apple-pay/)
* [Apple Pay on the web WWDC Session Video](https://developer.apple.com/videos/play/wwdc2016/703/)
* [Apple Pay Domain Verification](https://developer.apple.com/support/apple-pay-domain-verification/)

