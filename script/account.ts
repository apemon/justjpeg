import { createAccount, fundAccount, getResources, instantiate, loadAccount, loadAccountWithAddress } from "./util";

require('dotenv').config()
const { MNEMONIC, BUYER, NETWORK } = process.env;

(async () => {
    const admin = loadAccount(MNEMONIC || '')
    console.log(admin.address().hex())
    console.log(admin.toPrivateKeyObject().privateKeyHex)
    const { client, faucet } = await instantiate(NETWORK || '')
    //await fundAccount(faucet, admin, 1000000000000000000)
    const resources = await getResources(client, admin.address().hex())
    console.log(resources)

    // const buyer = loadAccount(BUYER || '')
    // console.log(buyer.address().hex())
    // const { client, faucet } = await instantiate(NETWORK || '')
    // await fundAccount(faucet, buyer, 1000000000000000000)
    // await getResources(client, buyer.address().hex())
})()