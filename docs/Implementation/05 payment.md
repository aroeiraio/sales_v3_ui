Payment Screen UI (Checkout → Payment Flow)

We are implementing the **Payment Screen** of a **PoS interface**.
The UI must call the **sales API** and react correctly to returned statuses.
Follow the **flows, messages, and transitions** carefully.


Animate success message with green circular background diminishing end show in the end success icon (in white color).
Animate unsuccess message with red circular background diminishing end show in the end failure icon (in white color).

---

## 1. Credit & Debit Cards (MercadoPago Pinpad) 
### API Requests

* **Credit button** - Under Checkout Screen

```bash
curl --location 'http://localhost:8090/interface/payment' \
--header 'Content-Type: application/json' \
--data '{
  "broker": "MERCADOPAGO_PINPAD",
  "method": "credit"
}'
```

* **Debit button** - Under Checkout Screen

```bash
curl --location 'http://localhost:8090/interface/payment' \
--header 'Content-Type: application/json' \
--data '{
  "broker": "MERCADOPAGO_PINPAD",
  "method": "debit"
}'
```

* **Status polling**

```bash
curl --location 'http://localhost:8090/interface/payment/status'
```

---

### Refused Flow (Messages)

1. `WAIT` → **initial waiting screen**
2. `INSERT_TAP_CARD` → **Insert/Swipe/Tap Card screen**
3. `SHOW_RETRY` (PAYMENT\_REFUSED) → **Payment Refused Screen** with retry option

   * If `SHOW_RETRY` → user may retry payment (back to Checkout)
   * If not `SHOW_RETRY` → go to **End Screen**

---

### Approved Flow (Messages)

1. `WAIT` → **initial waiting screen**
2. `INSERT_TAP_CARD` → **Insert/Swipe/Tap Card screen**
3. `RELEASE` (PAYMENT\_APPROVED) → **Payment Approved Screen**

👉 On success, redirect to **Payment Screen Card**
📘 Reference: `docs/06_payment_with_card.md`

---

## 2. Pix (MercadoPago)

### API Request - Under Checkout Screen

```bash
curl --location 'http://localhost:8090/interface/payment' \
--header 'Content-Type: application/json' \
--data '{
  "broker": "MERCADOPAGO",
  "method": "mercadopago"
}'
```

* **Status polling**

```bash
curl --location 'http://localhost:8090/interface/payment/status'
```

👉 On success, redirect to **Payment Screen Pix**
📘 Reference: `docs/05_payment_with_pix.md`

---

## 3. Unified Flow Diagram

```
[Checkout Screen]
        |
        |---> Card (Credit/Debit)
        |         |
        |         → WAIT (idle)
        |         → INSERT_TAP_CARD (waiting for TEF)
        |         → ┌── RELEASE (PAYMENT_APPROVED) → [Payment Approved Screen] → [End Screen]
        |           └── SHOW_RETRY (PAYMENT_REFUSED) → [Payment Refused Screen]
        |                       |-- Retry? Yes → back to Checkout
        |                       |-- Retry? No → End Screen (with sorry message all payments tries failed, try another time)
        |
        |---> Pix
        |         |
        |         → API request (broker=MERCADOPAGO, method=mercadopago)
        |         → ┌── RELEASE (PAYMENT_APPROVED) → [Payment Approved Screen] → [End Screen]
        |           └── SHOW_RETRY (PAYMENT_REFUSED) → [Payment Refused Screen]
        |                       |-- Retry? Yes → back to Checkout
        |                       |-- Retry? No → End Screen (with sorry message all payments tries failed, try another time)
```

---

## 4. Global References

* Payment Approved → `docs/08_payment_approved.md`
* Payment Refused → `docs/07_payment_refused.md`
* End Screen → `docs/09_end_screen.md`

---

✅ Deliverable:
Implement **UI screens and transitions** exactly as mapped in the unified diagram.
Each API response dictates the **next UI state**.

---

Would you like me to also **split the unified diagram into a swimlane version** (separate lanes for *Card* vs *Pix*) so Claude can clearly see both flows side by side?

