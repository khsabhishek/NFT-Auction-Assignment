## Functions explanation 
Let's go through each feature of the smart contract:

- The `createAuction` function allows a user to create an auction for their NFT. It checks that the user owns the NFT, sets a floor price for the auction, and requires the user to approve the smart contract to transfer the NFT. It also transfers the NFT from the user to the smart contract.
- The `cancelAuction` function allows the seller to cancel an auction that hasn't received any bids. It checks that the user is the seller and that there are no bids on the auction. It transfers the NFT back to the seller.
- The `bid` function allows a user to place a bid on an ongoing auction. It checks that the auction hasn't ended, that the bid is greater than or equal to the floor price and the current highest bid, and that the user isn't the seller. If there was a previous highest bidder, it returns their funds. It sets the new highest bidder and records their bid.
- The `endAuction` function allows the seller to end an auction after the duration has passed. It checks that the auction has ended and that there's at least one bid. It transfers the NFT to the highest bidder and the payment to the seller.
- The `retrieveFunds` function allows a user to retrieve their funds if they were outbid in an auction. It checks that the auction has ended, that the user hasn't won the auction, and that the user has placed a bid. It transfers the user's funds back to them.

The smart contract uses the OpenZeppelin libraries for the ERC721 and ERC20 token interfaces, as well as for safe transfers of ERC20 tokens. It also uses the `Ownable` contract from OpenZeppelin to implement an owner role for the contract.

To deploy this smart contract, you would need to provide the addresses of the NFT and ERC20 token contracts as constructor arguments. Once deployed, users can interact with the functions of the contract using a web3-enabled wallet like MetaMask. The contract supports bidding and payments in any ERC20 token, as long as it has been approved by the bidder or seller.

## Contract Addresses
The addresses of the contracts deployed to the Fuse testnet are:
    1. NFTAuction - https://explorer.fusespark.io/address/0xe22B12F480eD41920c15Fc5284b7ba6a06C7AEca

## Coverage Report of testcases
In my testcases in have covered 100% lines in marketplace contract
------------------|----------|----------|----------|----------|----------------|
File              |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------|----------|----------|----------|----------|----------------|
 contracts\       |       90 |    71.43 |    73.33 |    92.45 |                |
  ERC20.sol       |       50 |       25 |       60 |       50 |          13,17 |
  ERC721.sol      |       50 |       25 |       60 |       50 |          13,17 |
  marketplace.sol |      100 |      100 |      100 |      100 |                |
------------------|----------|----------|----------|----------|----------------|
All files         |       90 |    71.43 |    73.33 |    92.45 |                |
------------------|----------|----------|----------|----------|----------------|

## Audit report

I have used slither to audit my contract and every thing was secured.
