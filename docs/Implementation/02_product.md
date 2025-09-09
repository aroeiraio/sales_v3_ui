Products Page UI


Now you are integrating the sales API.

We are working on the **Product Screen** of a PoS interface. Follow these rules carefully:


For success message, show a toast message with message content.
For failure message, show a dialog with message content and a close button.

---

## 1. General Settings & Logotype

* Fetch interface settings from:
  `http://localhost:8090/interface/visual_settings`
* If `logotype_image` exists, display it. Otherwise, use the default logo.
* The response format:

```json
[
  {
    "background_color": "",
    "background_image": "/media/customer/",
    "font_color": "",
    "logotype_image": "/media/customer/",
    "logotype_pos_x": "",
    "logotype_pos_y": ""
  },
  {
    "timestamp": "2025-09-06T10:18:11.439"
  }
]
```

---

## 2. Search Box

* Perform searches with:
  `http://localhost:8090/interface/products/:expression:`
* Include an **X button** to clear the search and reload the default product list.

---

## 3. Categories (Drawer Menu)

* Categories are fetched from:
  `http://localhost:8090/interface/categories`
* Response format:

```json
[
  {
    "categoryId": -200,
    "description": "Produtos destacados",
    "name": "Destaques",
    "position": -2
  },
  {
    "categoryId": 602,
    "description": "",
    "name": "BEBIDAS",
    "position": 0
  },
  {
    "categoryId": 604,
    "description": "DESCRIÇÃO DA CATEGORIA 2",
    "name": "CATEGORIA 2",
    "position": 0
  },
  {
    "categoryId": 607,
    "description": "",
    "name": "SNACKS",
    "position": 0
  },
  {
    "timestamp": "2025-09-06T17:08:54.564"
  }
]
```

* Requirements:

  * Categories must be shown inside a **drawer menu**.
  * Hide `"Produtos destacados"` from the menu list.
  * The label where `"Bebidas"` appears should instead display `"Destaques"`.

---

## 4. Products Display

* Default endpoint:
  `http://localhost:8090/interface/products/`
* Products are grouped by category.
* **Layout rule:** max 3 products per row (HD or Full HD).
* Product structure example:

```json
[
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
    "saleLimit": 100,
    "type": "product"
  }
]
```

### Product Card

* Show:

  * Image
  * Name (truncate if > 50 chars)
  * Price (format: `R$ 0,00`)
  * A **+ button** to add product to cart.

### Product Dialog (on image click)

* Show: photo, name, description, price, and “Add to Cart” button.
* Include a **Close button**.
* If the user adds the product from this dialog:

  * Send request:

    ```bash
    curl --location 'http://localhost:8090/interface/cart/' \
    --header 'Content-Type: application/json' \
    --data '{
        "type": "product",
        "itemId": 4438
    }'
    ```
  * On **success (HTTP 200)**, close the dialog and show a **toast** with message:

    ```json
    {
      "message": "O produto foi para o carrinho!",
      "msg_code": "CART_ADDED_ITEM"
    }
    ```
  * On **error (HTTP 400)**, show a **modal** with the `message` parameter.

---

## 5. Cart Summary Bar

* If at least one item is added to the cart, show a bottom bar:

  * Format: `(#items) Total Price`
  * Include a **“Ver Carrinho”** button.

---

## 6. Session Timeout

* If no interaction for **60 seconds**, destroy session and redirect to **Start Screen**.
* Endpoint:

  ```bash
  curl --location --request DELETE 'http://localhost:8090/interface/session' --data ''
  ```

---

📘 Reference: `docs/02_products.md`

* After finishing it, wait for instructions from the Cart Screen.

