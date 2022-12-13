import {
  assert,
  describe,
  test,
  clearStore,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import {AccountToken, Balance} from "../generated/schema"
import {handleTransfer} from "../src/vault"
import {createTransferEvent} from "./vault-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

const nullAcc = Address.fromString('0x0000000000000000000000000000000000000000')
const acc1 = Address.fromString('0x625B312DE10e8e386cb1aFcE31ee7829E4d9F590')
const acc2 = Address.fromString('0x625B312DE10e8e386cb1aFcE31ee7829E4d9F591')
const token1 = Address.fromString('0xdcae48ffdde7c388da3a7b2de36f61e20f1d8a39')
const token2 = Address.fromString('0xadb7bac95560a54a10a6e7ef0de68195f540aa59')

describe("Describe entity assertions", () => {
  afterEach(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test('Should have correct balance when transfer', () => {
    const to = acc1
    const amount = BigInt.fromI32(1)

    const transferEvent = createTransferEvent(
        nullAcc,
        to,
        amount
    )

    handleTransfer(transferEvent)

    const accountToken = AccountToken.load(to.concat(transferEvent.address))!
    const balance = Balance.load(accountToken.balance)!
    assert.assertNotNull(accountToken)
    assert.bigIntEquals(amount, balance.value)
    assert.bigIntEquals(BigInt.fromI32(99999999), balance.blockNumberEnd)

    const nullAccountToken = AccountToken.load(nullAcc.concat(transferEvent.address))!
    const nullBalance = Balance.load(nullAccountToken.balance)!
    assert.bigIntEquals(BigInt.fromI32(-1), nullBalance.value)
  })

  test('Should have correct balance after some number of transfers', () => {
    const transfer1 = createTransferEvent(
        nullAcc,
        acc1,
        BigInt.fromI32(2))

    handleTransfer(transfer1)

    const transfer2 = createTransferEvent(
        nullAcc,
        acc2,
        BigInt.fromI32(2),
        BigInt.fromI32(2))

    handleTransfer(transfer2)

    const transfer3 = createTransferEvent(
        acc1,
        acc2,
        BigInt.fromI32(1),
        BigInt.fromI32(3)
    )

    handleTransfer(transfer3)

    const accountToken1 = AccountToken.load(acc1.concat(transfer1.address))!
    const accountToken2 = AccountToken.load(acc2.concat(transfer1.address))!
    const balance1 = Balance.load(accountToken1.balance)!
    const balance2 = Balance.load(accountToken2.balance)!

    assert.entityCount('Balance', 6)
    assert.bigIntEquals(balance1.value, BigInt.fromI32(1))
    assert.bigIntEquals(balance2.value, BigInt.fromI32(3))
  })

  test('Should have balances from different tokens', () => {
    const transfer1 = createTransferEvent(
        nullAcc,
        acc1,
        BigInt.fromI32(2),
        BigInt.fromI32(1),
        token1
    )

    handleTransfer(transfer1)

    const transfer2 = createTransferEvent(
        nullAcc,
        acc1,
        BigInt.fromI32(3),
        BigInt.fromI32(2),
        token2
    )

    handleTransfer(transfer2)

    const accountToken1 = AccountToken.load(acc1.concat(transfer1.address))!
    const accountToken2 = AccountToken.load(acc1.concat(transfer2.address))!
    const balance1 = Balance.load(accountToken1.balance)!
    const balance2 = Balance.load(accountToken2.balance)!

    assert.entityCount('Balance', 4)
    assert.bigIntEquals(balance1.value, BigInt.fromI32(2))
    assert.bigIntEquals(balance2.value, BigInt.fromI32(3))
  })
})
