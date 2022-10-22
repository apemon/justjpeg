module justjpeg::Minter {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_token::token::{ Self, TokenMutabilityConfig};

    const MODULE_ADMIN: address = @justjpeg;

    // error code

    // resource
    struct ResourceAccountCap has key {
        cap: account::SignerCapability
    }

    struct State has key {
        minted: u64
    }

    struct BuyerCounter has key {
        counter: u64
    }

    struct Property has key, store {
        collection: String,
        creator: address,
        token_base_name: String,
        description: String,
        maximum: u64,
        limit_per_address: u64,
        token_uri: String,
        royalty_address: address,
        royalty_denominator: u64,
        royalty_numerator: u64,
        token_mutage_config: TokenMutabilityConfig,
        property_keys: vector<String>,
        property_values: vector<vector<u8>>,
        property_types: vector<String>
    }

    public entry fun init_minter(
        admin: &signer,
        seeds: String
    ) {
        let admin_address = signer::address_of(admin);
        assert!(admin_address == MODULE_ADMIN, 0);
        assert!(!exists<ResourceAccountCap>(admin_address), 1);
        let (resource_signer, cap) = account::create_resource_account(admin, *string::bytes(&seeds));
        move_to(admin, ResourceAccountCap { cap });
        token::initialize_token_store(&resource_signer);
    }

    public entry fun create_collection(
        admin: &signer,
        collection_name: String,
        description: String,
        uri: String,
        maximum: u64,
        limit_per_address: u64,
        token_base_name: String,
        token_uri: String,
        royalty_address: address,
        royalty_denominator: u64,
        royalty_numerator: u64,
        mutate_setting: vector<bool>,
        property_keys: vector<String>,
        property_values: vector<vector<u8>>,
        property_types: vector<String>
    ) acquires ResourceAccountCap {
        let admin_address = signer::address_of(admin);
        assert!(admin_address == MODULE_ADMIN, 0);
        let resource_signer = get_resource_account_signer(signer::address_of(admin));
        let resource_address = signer::address_of(&resource_signer);
        assert!(!exists<Property>(resource_address), 2);
        let token_mutage_config = token::create_token_mutability_config(&mutate_setting);
        move_to(&resource_signer, Property {
            collection: collection_name,
            creator: admin_address,
            token_base_name,
            description,
            token_uri,
            maximum,
            limit_per_address,
            royalty_address,
            royalty_denominator,
            royalty_numerator,
            token_mutage_config,
            property_keys,
            property_values,
            property_types
        });
        move_to(&resource_signer, State {
            minted: 0
        });
        token::create_collection(
            &resource_signer,
            collection_name,
            description,
            uri,
            maximum,
            vector<bool>[true,true,false]
        );
    }

    public entry fun pull_token(
        buyer: &signer,
        creator: address
    ) acquires ResourceAccountCap, Property, BuyerCounter, State {
        let resource_signer = get_resource_account_signer(creator);
        let resource_address = signer::address_of(&resource_signer);
        let property = borrow_global<Property>(resource_address);
        let buyer_address = signer::address_of(buyer);
        if (property.limit_per_address != 0) {
            if (!exists<BuyerCounter>(buyer_address)) {
                move_to(buyer, BuyerCounter {
                    counter: 0
                });
            };
            let counter = borrow_global_mut<BuyerCounter>(buyer_address);
            assert!(counter.counter + 1 <= property.limit_per_address, 3);
            counter.counter = counter.counter + 1;
        };
        let vec_u8 = vector::empty<u8>();
        let state = borrow_global_mut<State>(resource_address);
        let number = state.minted + 1;
        if (number == 0) {
            vector::push_back(&mut vec_u8, 48);
        } else {
            while (number != 0) {
                let mod = number % 10 + 48;
                vector::push_back(&mut vec_u8, (mod as u8));
                number = number / 10;
            };
        };
        vector::reverse(&mut vec_u8);
        let token_mut_config = property.token_mutage_config;
        let token_name = *&property.token_base_name;
        let token_uri = *&property.token_uri;
        string::append_utf8(&mut token_name, vec_u8);
        let tokendata_id = token::create_tokendata(
            &resource_signer,
            *&property.collection,
            token_name,
            *&property.description,
            1,
            token_uri,
            *&property.royalty_address,
            *&property.royalty_denominator,
            *&property.royalty_numerator,
            token_mut_config,
            *&property.property_keys,
            *&property.property_values,
            *&property.property_types
        );
        token::mint_token(
            &resource_signer,
            tokendata_id,
            1
        );
        token::mutate_token_properties(
            &resource_signer,
            resource_address,
            resource_address,
            *&property.collection,
            token_name,
            0,
            1,
            *&property.property_keys,
            *&property.property_values,
            *&property.property_types
        );
        let token_data_id = token::create_token_data_id(
            resource_address,
            *&property.collection,
            token_name
        );
        let token_id = token::create_token_id(token_data_id, 1);
        let token = token::withdraw_token(&resource_signer, token_id, 1);
        token::deposit_token(buyer, token);
        state.minted = state.minted + 1;
    }

    fun get_resource_account_signer(
        minter_address: address
    ): signer acquires ResourceAccountCap {
        let resource_account_cap =
            borrow_global<ResourceAccountCap>(minter_address);
        let resource_signer_from_cap = account::create_signer_with_capability(&resource_account_cap.cap);
        resource_signer_from_cap
    }

    #[test_only]
    fun init_test(admin: &signer, buyer: &signer) {
        use aptos_framework::account;
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(buyer));
    }

    #[test(admin = @justjpeg, buyer = @1001)]
    fun test_create_collection(
        admin: &signer, 
        buyer: &signer
    ) acquires ResourceAccountCap, Property, BuyerCounter, State {
        init_test(admin, buyer);
        init_minter(admin, string::utf8(b"seed"));
        let name = string::utf8(b"JustJpeg");
        let description = string::utf8(b"JustJpeg is nft that make for meme only. No Community, No Utility, Only Jpeg.");
        let uri = string::utf8(b"https://justjpeg.xyz");
        let token_uri = string::utf8(b"https://bafybeiexhoxcxahmux7ylgvt5xqonxlr4zjtlirqjnaiemjezc72yznx7i.ipfs.dweb.link");
        let maximum = 1000;
        let mutate_setting = vector<bool>[false, true, true, true, true, true];
        let property_keys = vector<String>[
            string::utf8(b"chain"),
            string::utf8(b"number")
        ];
        let property_values = vector<vector<u8>>[
            b"Aptos",
            b"1"
        ];
        let property_types = vector<String>[
            string::utf8(b"string"),
            string::utf8(b"number")
        ];
        create_collection(
            admin,
            name,
            description,
            uri,
            maximum,
            5,
            string::utf8(b"JustJpeg "),
            token_uri,
            signer::address_of(admin),
            100,
            5,
            mutate_setting,
            property_keys,
            property_values,
            property_types
        );
        pull_token(
            buyer,
            signer::address_of(admin)
        );
    }
}