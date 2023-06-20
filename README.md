# XRPL Multi TX Sender

This package contains a reference implementation of a "Sign & Submit"
service capable of submitting multiple transactions in parallel.

To do this, this tool uses the [Tickets feature](https://xrpl.org/ticketcreate.html#ticketcreate) of the XRPL.

## In scope

- Sending multiple transactions in parallel
- Ticket Refresh (auto obtain new tickets)

## Out of scope

- Authorization (add your own Auth middleware, IP whitelisting, etc)
- Retry: this lib. will not check the TX for finality

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

# Webserver

Default routes:

- `/state` - Serves basic information
- `/pay/{account}/{drops}` - Triggers a payout of drops to account (r...)
