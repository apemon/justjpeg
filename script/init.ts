import { BCS, TxnBuilderTypes } from "aptos";
import { instantiate, loadAccount, delay, serializeVectorString, serializeVectorOfVectorU8, serializeVectorBool } from "./util";

require('dotenv').config()
const { MNEMONIC, NETWORK } = process.env;

(async () => {
    const admin = loadAccount(MNEMONIC || '')
    const { client, faucet } = await instantiate(NETWORK || '')
    const adminAddress = admin.address().hex()
    console.log(`admin: ${adminAddress}`)
    // create new candy
    const initPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(
            `${adminAddress}::Minter`,
            "init_minter",
            [],
            [
                BCS.bcsSerializeStr("seed")
            ]
        )
    )
    await client.generateSignSubmitTransaction(admin, initPayload)
    await delay(1000)
    const collectionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(
            `${adminAddress}::Minter`,
            "create_collection",
            [],
            [
                BCS.bcsSerializeStr("Just Jpeg"),
                BCS.bcsSerializeStr("Just random pixelize banana jpeg image. No Value, No Community, Only Jpeg."),
                BCS.bcsSerializeStr("https://bafybeiexhoxcxahmux7ylgvt5xqonxlr4zjtlirqjnaiemjezc72yznx7i.ipfs.dweb.link"),
                BCS.bcsSerializeUint64(1000),
                BCS.bcsSerializeUint64(5),
                BCS.bcsSerializeStr("J&J "),
                BCS.bcsSerializeStr("https://bafybeiexhoxcxahmux7ylgvt5xqonxlr4zjtlirqjnaiemjezc72yznx7i.ipfs.dweb.link"),
                admin.address().toUint8Array(),
                BCS.bcsSerializeUint64(100),
                BCS.bcsSerializeUint64(5),
                serializeVectorBool([false, true, true, true, true, true]),
                serializeVectorString([
                    'chain',
                    'type'
                ]),
                serializeVectorOfVectorU8([
                    'Aptos',
                    'Jpeg'
                ]),
                serializeVectorString([
                    'string',
                    'string'
                ])
            ]
        )
    )
    await client.generateSignSubmitTransaction(admin, collectionPayload)
    await delay(1000)
})()