import {
  Transfer as TransferEvent,
} from "../generated/Vault/Vault"
import {
  Account, AccountToken,
  Balance,
  Transfer
} from "../generated/schema"
import {BigInt, Bytes} from "@graphprotocol/graph-ts";

function handleAccountTransfer(address: Bytes, transfer: Transfer): void {
  let account = Account.load(address)
  if (account == null) {
    account = new Account(address)
    account.save()
  }

  const balance = new Balance(
      address.toHexString().concat('-').concat(
          transfer.id.toHexString()
      )
  )

  const accountTokenId = address.concat(transfer.address)
  let accountToken = AccountToken.load(accountTokenId)
  if (accountToken == null) {
    accountToken = new AccountToken(accountTokenId)
    accountToken.account = account.id
    accountToken.token = transfer.address
    accountToken.balance = balance.id
  }

  balance.accountToken = accountToken.id
  balance.blockNumber = transfer.blockNumber
  balance.blockNumberEnd = BigInt.fromI32(99999999)
  balance.blockTimestamp = transfer.blockTimestamp
  balance.blockTimestampEnd = transfer.blockTimestamp.plus(BigInt.fromI32(315360000))
  balance.transfer = transfer.id
  balance.value = BigInt.zero()

  const isFrom = transfer.from === address

  let prevBalance: Balance = balance
  if (accountToken.balance !== balance.id) {
    prevBalance = Balance.load(accountToken.balance)!
    prevBalance.blockNumberEnd = transfer.blockNumber
    prevBalance.blockTimestampEnd = transfer.blockTimestamp
  }
  if (isFrom) {
    balance.value = prevBalance.value.minus(transfer.value)
  } else {
    balance.value = prevBalance.value.plus(transfer.value)
  }
  prevBalance.save()

  accountToken.balance = balance.id
  balance.save()
  accountToken.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
      event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.address = event.address
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  handleAccountTransfer(entity.from, entity)
  handleAccountTransfer(entity.to, entity)
}