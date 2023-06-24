# XRPL Parallel Payment Service - Multi TX Sender

This package contains a reference implementation of a "Sign & Submit"
service capable of submitting multiple transactions in parallel.

To do this, this tool uses the [Tickets feature](https://xrpl.org/ticketcreate.html#ticketcreate) of the XRPL.

## In scope

- Sending multiple transactions in parallel
- Ticket Refresh (auto obtain new tickets)

## Out of scope

- Authorization (add your own Auth middleware, IP whitelisting, etc)
- Retry: this lib. will not check the TX for finality

## Piece of advice

Advice: do not use this lib as is, where the payment information is SENT to this application.

Instead: offer a service that returns one transaction job at a time (and only once), and trigger
this application to **fetch** that job from your other application. This way the information
is always obtained from a trusted endpoint, instead of sent to this lib.

# Config

This lib. will check the environment and a `.env` file. The following env. vars can be passed:

- `NODE` - The XRPL node to connect to, e.g. `wss://xrplcluster.com`
- `ACCOUNT` - The XRPL account to send from (`r...`)
- `FAMILYSEED` - A secret in Family Seed format (`s...`) allowed to sign for `ACCOUNT`
- `MAXLEDGERS` - The max. ledgers a transaction is valid, if not included in a ledger, discard after this # ledgers
- `FEEDROPS` - The amount of drops (network fee) for transactions
- `MINTICKETS` - The min. amount of tickets to keep, if dropping below this value, new tickets will be created
- `CREATETICKETS` - The amount of tickets to create per ticket refresh (make sure to keep sufficient balance to satisfy the required reserve for this amount of tickets)
- `PORT` - The TCP port to run the servoce on (default: `3000`)

# Running

## Debug (CLI)

`npm run dev`

## Production (pm2)

`npm run pm2`

## Logging

This package uses the `debug` package for logging, meaning logging output will not be sent
to the console (stdout) with `console.log`, but instead it'll log based on a passed env. var:

To get logging output while manually running the process with node, run:

```
DEBUG=accacser* node index.mjs
```

# Webserver

Default routes:

- `/state` - Serves basic information
- `/pay/{account}/{drops}` - Triggers a payout of drops to account (r...)

## State response

```
{
  "account": "r...",
  "ticketCount": 22,
  "ticketRefreshCount": 0,
  "txCount": 0
}
```

## Pay response

Output of the XRPL `submit` websocket command;

```
{
  "accepted": true,
  /* More here */
  "engine_result": "tesSUCCESS",
  "engine_result_code": 0,
  "engine_result_message": "The transaction was applied. Only final in a validated ledger.",
  "tx_blob": "...",
  "tx_json": {
    "TransactionType": "Payment",
    /* More here */
    "TxnSignature": "...",
    "hash": "FCB655D6D2BC59661AFF96CFF60FB6FEC93B08736018E0416965CAC632AD881D"
  },
  "validated_ledger_index": 38824427
}
```
