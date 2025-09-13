## Overview

We need to implement a new screen called **"Out of Service"**.

This screen must be displayed when the user leaves the **Start Screen** if any blocking condition prevents a purchase, otherwise the **Product Screen** will be displayed.

### Blocking Conditions

The screen is shown if any of the following are true:

* `dispenser_controller = false`
* `internet_connectivity = false`
* `out_of_service = true`

Additionally, if the object `dispenser_status` exists in the payload, the following must also be checked:

* `door-opened = true`
* `drawers-unlocked = true`
* `hatch-opened = true`


### Unblocking Conditions

- After 60s of blocking, the system must consult status to check if the conditions are changed. If no conditions to block are achieved, redirect to **Product Screen**.
- Status pooling must be stopped if "out of service" screen is out of context.
- Add a button to return to Start Screen.


### UI Requirements

* Main headline: **"Fora de serviço"**
* Secondary information must display the specific reason(s):

| Condition                       | Message                                |
| ------------------------------- | -------------------------------------- |
| `dispenser_controller = false`  | "Falha de comunicação com controlador" |
| `internet_connectivity = false` | "Falha de acesso à Internet"           |
| `out_of_service = true`         | "Equipamento em manutenção"            |
| `door-opened = true`            | "Porta aberta"                         |
| `drawers-unlocked = true`       | "Gavetas destravadas"                  |
| `hatch-opened = true`           | "Portinhola aberta"                    |

If multiple conditions are true, list all corresponding messages.

---

## Endpoint

**GET** `http://localhost:8090/interface/status`

**Response example:**

```json
[
  {
    "dispenser_controller": true,
    "dispenser_status": {
      "door-opened": false,
      "drawers-unlocked": false,
      "hatch-opened": false
    },
    "internet_connectivity": true,
    "out_of_service": true,
    "smartlocker_controller": false
  },
  {
    "timestamp": "2025-09-13T12:33:05.980"
  }
]
```


