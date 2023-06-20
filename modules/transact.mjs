import _log from 'debug'
import assert from 'assert'
import { XrplClient } from 'xrpl-client'
import { sign, derive } from 'xrpl-accountlib'

const log = _log('accacser:transact')

let count = 0

const transactService = (getTicket, config) => {
  return {
    count () {
      return count
    },
    async submit (tx) {
      const ticket = await getTicket()

      const client = new XrplClient(config.node, {
        assumeOfflineAfterSeconds: 20,
        maxConnectionAttempts: 3,
        connectAttemptTimeoutSeconds: 5,
      })

      await client.ready()
  
      const transaction = Object.assign({}, {
        ...tx,
        Account: config.account,
        Fee: String(config.feedrops),  
        Sequence: 0,
        TicketSequence: ticket,
        LastLedgerSequence: client.getState().ledger.last + Number(config?.maxledgers || 10),
      })

      log('Signing & Submitting TX', tx, ticket)

      const { id, signedTransaction } = sign(transaction, derive.familySeed(config.familyseed))
      log('TX ID', id)

      count++

      const submitTimeout = setTimeout(() => {
        client.close()
      }, 30 * 1000)
  
      const submit = await client.send({
        command: 'submit',
        tx_blob: signedTransaction,
      })

      log({submit})

      clearTimeout(submitTimeout)
      client.close()

      return submit
    }
  }
}

export {
  transactService
}
