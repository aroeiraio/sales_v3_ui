Checkout Screen UI: From Cart Screen to Checkout Screen

Now you are integrating the sales API.

We are working on the **Checkout Screen** of a PoS interface. Follow these rules carefully:


For success message, show nothing.
For failure message, show a dialog with message content and a close button.

* Screen in portrait HD or Full HD

# Getting available payment systems

curl --location 'http://localhost:8090/interface/checkout'

Response if well succeed: HTTP 200
[
    {
        "available": "true",
        "broker": "MERCADOPAGO",
        "methods": [
            "mercadopago"
        ],
        "qrcode": "/media/customer/qrcode.png"
    },
    {
        "available": true,
        "broker": "MERCADOPAGO_PINPAD",
        "methods": [
            "debit",
            "credit"
        ]
    },
    {
        "timestamp": "2025-09-07T14:45:24.572"
    }
]

Name: MERCADOPAGO_PINPAD as MERCADOPAGO

For call any broker available, use:

curl --location 'http://localhost:8090/interface/payment' \
--header 'Content-Type: application/json' \
--data '{
    "broker": "MERCADOPAGO_PINPAD",
    "method": "debit"
}'

If it was well succeed, they should redirect to Card Screen for method debit or credit, or QR screen in the case of qrcode.


# 
📘 Reference: `docs/04_checkout.md`

