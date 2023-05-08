// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTAuction is Ownable {
    using SafeERC20 for IERC20;

    // NFT token being sold
    IERC721 public immutable nft;

    // ERC20 token accepted as payment
    IERC20 public immutable paymentToken;

    // Auction struct
    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        mapping(address => uint256) bids;
    }

    // List of ongoing auctions
    mapping(uint256 => Auction) public auctions;

    // Events
    event AuctionCreated(
        uint256 indexed tokenId,
        uint256 price,
        uint256 endTime
    );
    event AuctionCancelled(uint256 indexed tokenId);
    event HighestBidIncreased(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 bidAmount
    );
    event AuctionEnded(
        uint256 indexed tokenId,
        address indexed winner,
        uint256 winningBid
    );

    // Constructor
    constructor(IERC721 _nft, IERC20 _paymentToken) {
        nft = _nft;
        paymentToken = _paymentToken;
    }

    // Create an auction
    function createAuction(
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) external {
        require(nft.ownerOf(tokenId) == msg.sender, "You don't own the NFT");
        require(price > 0, "Price must be greater than zero");
        require(duration >= 1 minutes, "Duration must be at least 1 minute");
        require(
            nft.getApproved(tokenId) == address(this),
            "Contract not approved for NFT"
        );

        uint256 endTime = block.timestamp + duration;

       /**  auctions[tokenId] = Auction({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0
        });
*/ 

        auctions[tokenId].seller = msg.sender;
        auctions[tokenId].tokenId = tokenId;
        auctions[tokenId].price = price;
        auctions[tokenId].endTime = endTime;
        auctions[tokenId].highestBidder = address(0);
        auctions[tokenId].highestBid = 0;

        emit AuctionCreated(tokenId, price, endTime);

        nft.transferFrom(msg.sender, address(this), tokenId);
    }

    // Cancel an auction
    function cancelAuction(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];

        require(msg.sender == auction.seller, "You're not the seller");
        require(auction.highestBid == 0, "Auction already has bids");

        delete auctions[tokenId];

        emit AuctionCancelled(tokenId);

        nft.transferFrom(address(this), auction.seller, tokenId);
    }

    // Bid on an auction
    function bid(uint256 tokenId, uint256 amount) external {
        Auction storage auction = auctions[tokenId];

        require(block.timestamp < auction.endTime, "Auction has ended");
        require(
            amount >= auction.price,
            "Bid must be greater than or equal to the current price"
        );
        require(
            amount > auction.highestBid,
            "Bid must be greater than the highest bid"
        );
        require(
            msg.sender != auction.seller,
            "Seller cannot bid on their own auction"
        );

        if (auction.highestBidder != address(0)) {
            // Return funds to the previous highest bidder
            paymentToken.safeTransfer(
                auction.highestBidder,
                auction.highestBid
            );
        }

        // Set new highest bidder
        auction.highestBidder = msg.sender;
        auction.highestBid = amount;

        // Record bid for the bidder
        auction.bids[msg.sender] += amount;

        emit HighestBidIncreased(tokenId, msg.sender, amount);
    }

    // End an auction and transfer NFT to the highest bidder
    function endAuction(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];

        require(block.timestamp >= auction.endTime, "Auction hasn't ended yet");
        require(auction.highestBid > 0, "No bids were placed");

        address winner = auction.highestBidder;
        uint256 winningBid = auction.highestBid;

        delete auctions[tokenId];

        nft.transferFrom(address(this), winner, tokenId);
        paymentToken.safeTransfer(auction.seller, winningBid);

        emit AuctionEnded(tokenId, winner, winningBid);
    }

    // Retrieve funds for a bidder in an unsuccessful auction
    function retrieveFunds(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];

        require(block.timestamp >= auction.endTime, "Auction hasn't ended yet");
        require(
            auction.highestBidder != msg.sender,
            "You're the highest bidder"
        );
        require(auction.bids[msg.sender] > 0, "You haven't placed a bid");

        uint256 amount = auction.bids[msg.sender];

        delete auction.bids[msg.sender];

        paymentToken.safeTransfer(msg.sender, amount);
    }
}

/** 
 * 
Let's go through each feature of the smart contract:

- The `createAuction` function allows a user to create an auction for their NFT. It checks that the user owns the NFT, sets a floor price for the auction, and requires the user to approve the smart contract to transfer the NFT. It also transfers the NFT from the user to the smart contract.
- The `cancelAuction` function allows the seller to cancel an auction that hasn't received any bids. It checks that the user is the seller and that there are no bids on the auction. It transfers the NFT back to the seller.
- The `bid` function allows a user to place a bid on an ongoing auction. It checks that the auction hasn't ended, that the bid is greater than or equal to the floor price and the current highest bid, and that the user isn't the seller. If there was a previous highest bidder, it returns their funds. It sets the new highest bidder and records their bid.
- The `endAuction` function allows the seller to end an auction after the duration has passed. It checks that the auction has ended and that there's at least one bid. It transfers the NFT to the highest bidder and the payment to the seller.
- The `retrieveFunds` function allows a user to retrieve their funds if they were outbid in an auction. It checks that the auction has ended, that the user hasn't won the auction, and that the user has placed a bid. It transfers the user's funds back to them.

The smart contract uses the OpenZeppelin libraries for the ERC721 and ERC20 token interfaces, as well as for safe transfers of ERC20 tokens. It also uses the `Ownable` contract from OpenZeppelin to implement an owner role for the contract.

To deploy this smart contract, you would need to provide the addresses of the NFT and ERC20 token contracts as constructor arguments. Once deployed, users can interact with the functions of the contract using a web3-enabled wallet like MetaMask. The contract supports bidding and payments in any ERC20 token, as long as it has been approved by the bidder or seller.

 */
