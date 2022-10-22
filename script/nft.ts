import { TokenClient, TokenTypes } from "aptos";
import { createAccount, fundAccount, getResources, instantiate, loadAccount, loadAccountWithAddress, createNftCollection } from "./util";

require('dotenv').config()
const { MNEMONIC, BUYER, NETWORK } = process.env;

(async () => {
    const admin = loadAccount(MNEMONIC || '')
    const adminAddress = admin.address().hex()
    const account = loadAccount(BUYER || '')
    const accountAddress = account.address().hex()
    const collection = 'Just Jpeg'
    const tokenBase = 'J&J'
    const number = '1'
    const name = `${tokenBase} ${number}`
    const { client, faucet, token } = await instantiate(NETWORK || '')
    console.log(accountAddress)
    // get creator address
    const resources = await getResources(client, adminAddress)
    const resourceAccountCap: any = resources.filter(res => res.type == `${adminAddress}::Minter::ResourceAccountCap`)[0]
    const creatorAddress = resourceAccountCap?.data?.cap.account
    console.log(creatorAddress)
    // nft
    const collectionData: any = await token.getCollectionData(creatorAddress, collection)
    console.log(collectionData)
    const tokenData: any = await token.getTokenData(creatorAddress, collection, name)
    console.log(tokenData)
    console.log(tokenData.default_properties.map.data)
    // get owner of nft
    const tokenId = {
        token_data_id: {
            creator: creatorAddress,
            collection,
            name
        },
        property_version: '1'
    }
    const nft: any = await token.getTokenForAccount(accountAddress, tokenId)
    console.log(nft)
    console.log(nft.token_properties.map.data)
})()