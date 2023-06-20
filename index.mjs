import express from 'express'
import assert  from 'assert'
import _log from 'debug'
import dotenv from 'dotenv'
import { ticketService } from './modules/tickets.mjs'
import { transactService } from './modules/transact.mjs'

/**
 * DANGER! THERE IS NO ENDPOINT AUTH OR PROTECTION
 * WHATSOEVER! PLEASE ADD YOUR OWN AUTH MIDDLEWARE
 * AND IP WHITELISTING, ETC.
 */

const log = _log('accacser')

log('Starting app...')
const app = express()

const config = {
  node: 'wss://testnet.xrpl-labs.com',
  account: 'rhZ3E8LLdwQt8WuFgmPvu9j3npjDb7Xu4z', // TESTNET (No bug bounty ;))
  familyseed: 'sEd7ZyacaRt9gh9DENZkSEKP4je31qy', // TESTNET (No bug bounty ;))
  maxledgers: 10,
  feedrops: 10,
  minTickets: 5,
  createTickets: 20,
  port: 3000,
}

const envConfig = (dotenv.config().parsed || {})
log({envConfig})

Object.keys(envConfig).forEach(k => {
  const lowerCaseKey = k.toLowerCase()
  const baseConfigKeys = Object.keys(config)
  const lowerBaseConfigKeys = Object.keys(config).map(bk => bk.toLowerCase())
  const keyMatch = lowerBaseConfigKeys.indexOf(lowerCaseKey)

  if (keyMatch > -1) {
    Object.assign(config, {
      [baseConfigKeys[keyMatch]]: envConfig[k]
    })
  }
})

log('Config', Object.assign({}, {
  ...config,
  familyseed: '<<<<<<<<<<<<<<< SECRET >>>>>>>>>>>>>>>'
}))

assert(config?.account, 'Config (account) missing')
assert(config?.familyseed, 'Config (familyseed) missing')

const {
  get: getTicket,
  ready: ticketServiceReady,
  count: ticketCount,
  refreshCount: ticketRefreshCount
} = ticketService(config)

await ticketServiceReady()

const {
  submit,
  count: txCount,
} = transactService(getTicket, config)

log(`Distributing from\n > ${config.account}`)

/**
 * Start Webserver
 */

const port = Number(config.port)

app.listen(port)
log('Listening at port', port)

/**
 * Add routes
 */

app.get('/state', async (req, res) => {
  return res.json({
    account: config.account,
    ticketCount: ticketCount(),
    ticketRefreshCount: ticketRefreshCount(),
    txCount: txCount(), 
  })
})

// 
// ADD YOUR OWN TX PROCESSORS OVER HERE
// 
// A GOOD PRACTICE WOULD BE TO SEND NO INFORMATION
// IN THE ROUTE OR PARAMS, BUT SIMPLY TRIGGER THIS
// CODE TO FETCH A JOB FROM YOUR OWN SECURED INFRA
// AND PROCESS BASED ON THAT FETCHED INFO INSTEAD OF
// CALLED INFO.
// 

app.get('/pay/:account(r[a-zA-Z0-9]{16,})/:amount([0-9]{1,})', async (req, res) => {
  /**
   * This is where you change the tx logic.
   * WARNING! ADD PROPER CHECKS, MAX AMOUNT, ETC!
   */
  res.json(await submit({
    TransactionType: 'Payment',
    Destination: req.params.account,
    Amount: String(req.params.amount || 1),
  }))
})
