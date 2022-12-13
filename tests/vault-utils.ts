import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Transfer,
} from "../generated/Vault/Vault"

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt,
  logIndex: BigInt = BigInt.fromI32(1),
  address: Address = Address.fromString('0xA16081F360e3847006dB660bae1c6d1b2e17eC2A'),
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())
  if (address) {
    transferEvent.address = address
  }
  transferEvent.logIndex = logIndex

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}
