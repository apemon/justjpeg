import { BCS, TxnBuilderTypes } from "aptos";
import { instantiate, loadAccount, delay, serializeVectorString, serializeVectorOfVectorU8, serializeVectorBool } from "./util";


require('dotenv').config()
const { MNEMONIC, BUYER, NETWORK } = process.env;

(async () => {
    const admin = loadAccount(MNEMONIC || '')
    const adminAddress = admin.address().hex()
    const buyer = loadAccount(BUYER || '')
    const { client, faucet } = await instantiate(NETWORK || '')
    const buyerAddress = buyer.address().hex()
    console.log(`buyer: ${buyerAddress}`)
    // pull candy
    const pullPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(
            `${adminAddress}::Minter`,
            "pull_token",
            [],
            [
                admin.address().toUint8Array()
            ]
        )
    )
    await client.generateSignSubmitTransaction(buyer, pullPayload)
    await delay(1000)
})()