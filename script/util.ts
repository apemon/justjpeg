import { AptosAccount, AptosClient, BCS, FaucetClient, MaybeHexString, TokenClient, TxnBuilderTypes } from "aptos";
import * as Gen from 'aptos/src/generated/index'

export const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
export const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
export const MAX_U64_BIG_INT = BigInt(2 ** 64) - BigInt(1);

export interface CollectionMutableOption {
    allowChangeDescription: boolean
    allowChangeUri: boolean
    allowChangeMaxSupply: boolean
}

const networks: Record<string, any> = {
    local: {
        url: 'http://0.0.0.0:8080',
        faucet: 'http://0.0.0.0:8081'
    },
    devnet: {
        url: 'https://fullnode.devnet.aptoslabs.com',
        faucet: 'https://faucet.devnet.aptoslabs.com'
    },
    testnet: {
        url: 'https://fullnode.testnet.aptoslabs.com',
        faucet: 'https://faucet.testnet.aptoslabs.com'
    },
    mainnet: {
        url: 'https://fullnode.mainnet.aptoslabs.com',
        faucet: 'https://faucet.mainnet.aptoslabs.com'
    }
}

export const instantiate = async (networkName: string) => {
    const network: any = networks[networkName]
    const client = new AptosClient(network.url)
    const faucet = new FaucetClient(network.url, network.faucet)
    const token = new TokenClient(client)
    return {
        client,
        faucet,
        token
    }
}

export const loadAccount = (mnemonic: string) => {
    const account = AptosAccount.fromDerivePath(`m/44'/637'/0'/0'/0'`, mnemonic)
    return account
}

export const loadAccountWithAddress = (privateKey: Uint8Array, address: MaybeHexString) => {
    const account = new AptosAccount(privateKey, address)
    return account
}

export const createAccount = async (faucet: FaucetClient, account: AptosAccount) => {
    await faucet.fundAccount(account.address(), 0)
}

export const fundAccount = async (faucet: FaucetClient, account: AptosAccount, amount: number) => {
    await faucet.fundAccount(account.address(), amount)
}

export const getResources = async (client: AptosClient, account: string): Promise<Gen.MoveResource[]> => {
    const resources = await client.getAccountResources(account)
    return resources
}

export const createNftCollection = async (
    client: AptosClient,
    account: AptosAccount,
    name: string,
    description: string,
    uri: string,
    maxAmount: BCS.AnyNumber = MAX_U64_BIG_INT,
    mutationOption?: CollectionMutableOption
) => {
    let mutations: boolean[] = [false, false, false]
    if (mutationOption) {
        if (mutationOption.allowChangeDescription) {
            mutations[0] = true
        }
        if (mutationOption.allowChangeUri) {
            mutations[1] = true
        }
        if (mutationOption.allowChangeMaxSupply) {
            mutations[2] = true
        }
    }
    const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(
            "0x3::token",
            "create_collection_script",
            [],
            [
                BCS.bcsSerializeStr(name),
                BCS.bcsSerializeStr(description),
                BCS.bcsSerializeStr(uri),
                BCS.bcsSerializeUint64(maxAmount),
                serializeVectorBool(mutations),
            ]
        )
    )
    return await client.generateSignSubmitTransaction(account, payload)
}

// export const getTable = async (client: AptosClient) => {
//     const getTableParam: Gen.TableItemRequest = {
//         key_type,
//         value_type,
//         key
//     }
// }

export const delay = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms, {}))
}

export function serializeVectorBool(vecBool: boolean[]) {
    const serializer = new BCS.Serializer();
    serializer.serializeU32AsUleb128(vecBool.length);
    vecBool.forEach((el) => {
        serializer.serializeBool(el);
    });
    return serializer.getBytes();
}

export function serializeVectorString(vecString: string[]) {
    const serializer = new BCS.Serializer();
    serializer.serializeU32AsUleb128(vecString.length);
    vecString.forEach((el) => {
        serializer.serializeStr(el);
    });
    return serializer.getBytes();
}

export function serializeVectorOfVectorU8(vecString: string[]) {
    const serializer = new BCS.Serializer();
    let encoder = new TextEncoder();
    serializer.serializeU32AsUleb128(vecString.length);
    vecString.forEach((el) => {
        let bytes = encoder.encode(el)
        serializer.serializeBytes(bytes)
    });
    return serializer.getBytes();
}