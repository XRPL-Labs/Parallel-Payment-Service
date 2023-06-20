import _log from 'debug'
import assert from 'assert'
import { XrplClient } from 'xrpl-client'
import { sign, derive } from 'xrpl-accountlib'

const log = _log('accacser:tickets')

let ticketRefreshTimeout
let ticketTimer
let refreshingTickets = false

let refreshCount = 0

let tickets = []

let ticketServiceReady = false
let ticketServiceReadyResolve

const ready = () => new Promise(resolve => {
  ticketServiceReadyResolve = () => {
    resolve()
    ticketServiceReady = true
  }
})

const ticketService = config => {
  const refreshTickets = async client => {
    refreshingTickets = true
    ticketRefreshTimeout = setTimeout(() => {
      if (refreshingTickets) {
        log('Ticket Refresh timeout, clearing "refreshingTickets"')
        refreshingTickets = false
        client.close()
      }
    }, 60 * 1000)

    const {account_data} = await client.send({
      account: config.account,
      command: 'account_info'
    })

    log('Account sequence', account_data.Sequence)
    log('Ledger', client.getState().ledger.last)
    
    const transaction = {
      TransactionType: 'TicketCreate',
      Account: config.account,
      Fee: String(config.feedrops),
      TicketCount: config.createTickets,
      Sequence: account_data.Sequence,
      LastLedgerSequence: client.getState().ledger.last + Number(config?.maxledgers || 10),
    }

    const { id, signedTransaction } = sign(transaction, derive.familySeed(config.familyseed))
    log('Submitting TicketCreate TX', id)

    const submit = await client.send({
      command: 'submit',
      tx_blob: signedTransaction,
    })

    log('Submitted new TicketCreate TX', submit)
    refreshCount++

    await new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, 20 * 1000)
    })

    refreshingTickets = false
    clearTimeout(ticketRefreshTimeout)
    client.close()

    log('Created new tickets... Update ticket count to catch up...')

    return updateTicketCount()
  }

  const updateTicketCount = async (fetchIfTooLow = true) => {
    log('Refreshing tickets')

    const client = new XrplClient(config.node, {
      assumeOfflineAfterSeconds: 20,
      maxConnectionAttempts: 3,
      connectAttemptTimeoutSeconds: 5,
    })

    await client.ready()

    const currentTickets = await client.send({
      account: config.account,
      command: 'account_objects',
      type: 'ticket',
    })

    const ticketCount = (currentTickets?.account_objects || []).length
    log('Tickets for', config.account, ticketCount)

    if (ticketCount <= config.minTickets) {
      if (refreshingTickets) {
        log('Tickets being refreshed, skip...') 
      } else {
        if (fetchIfTooLow) {
          log('Tickets lt min, obtain new ones', config.minTickets, ticketCount)
          refreshTickets(client)
        } else {
          log('Error refreshing tickets (?)')
        }
      }
    } else {
      tickets = currentTickets.account_objects.map(t => t.TicketSequence)
      if (!ticketServiceReady) {
        ticketServiceReadyResolve()
      }  
    }

    return
  }

  updateTicketCount()
  ticketTimer = setInterval(() => {
    updateTicketCount()
  }, 60 * 5 * 1000)
  
  return {
    async get () {
      log('Get Ticket - curlen: ', tickets.length)

      if (tickets.length < 1) {
        // Required
        log('No tickets, refreshing...')
        await updateTicketCount()
      }

      const first = tickets?.[0]
      assert(typeof first === 'number', 'No ticket left')
      tickets.splice(0, 1)

      log('Ticket obtained', first)
      
      if (tickets.length <= config.minTickets) {
        // Pre emtive
        updateTicketCount()
      }

      return first
    },
    ready,
    count () {
      return tickets.length
    },
    refreshCount () {
      return refreshCount
    },
  }
}

export {
  ticketService,
}
