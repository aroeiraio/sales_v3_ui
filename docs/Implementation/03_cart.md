Cart Screen UI

Now you are integrating the sales API.

We are working on the **Cart Screen** of a PoS interface. Follow these rules carefully:

For success message, show a toast message with message content.
For failure message, show a dialog with message content and a close button.

* Screen in portrait HD or Full HD

* List of products on cart

* Default endpoint:
  `http://localhost:8090/interface/cart/`
* Product structure example:

```json
[
    {
        "amount": 8,
        "categoryId": 602,
        "controlled": 0,
        "description": "KitKat",
        "expiration": "2025-09-27",
        "itemId": 4436,
        "media": [
            {
                "filename": "2cdd2dd9-5f9.jpg",
                "pending": 0,
                "source": "/media/images/2cdd2dd9-5f9.jpg",
                "url": "https://imach.s3.amazonaws.com/core-web-application/images/2cdd2dd9-5f9.jpg"
            }
        ],
        "name": "KitKat",
        "price": 1.51,
        "quantity": 3,
        "saleLimit": 10,
        "subtotal": 4.53,
        "type": "product",
        "variantId": 0
    },
    {
        "amount": 8,
        "categoryId": 602,
        "controlled": 0,
        "description": "Nenhuma descrição cadastrada",
        "expiration": "2025-09-23",
        "itemId": 4374,
        "media": [
            {
                "filename": "72840733-696.jpg",
                "pending": 1,
                "source": "/media/images/72840733-696.jpg",
                "url": "https://imach.s3.amazonaws.com/core-web-application/images/72840733-696.jpg"
            }
        ],
        "name": "Coca-cola",
        "price": 1.5,
        "quantity": 5,
        "saleLimit": 100,
        "subtotal": 7.5,
        "type": "product",
        "variantId": 0
    },
    {
        "quantity": 8,
        "total": "12.03"
    }
]
```

* Add item
curl --location 'http://localhost:8090/interface/cart/' \
--header 'Content-Type: application/json' \
--data '{
    "type": "product",
    "itemId": 4438
}'

* Remove item
curl --location --request DELETE 'http://localhost:8090/interface/cart/' \
--header 'Content-Type: application/json' \
--data '{
    "type": "product",
    "itemId": 4438
    }'


* Remove all quantities of a product

API not provide this method. So, not show the button for it.

📘 Reference: `docs/03_cart.md`
