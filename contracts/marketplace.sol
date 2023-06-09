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

        address seller = auction.seller;

        require(msg.sender == auction.seller, "You're not the seller");
        require(auction.highestBid == 0, "Auction already has bids");

        delete auctions[tokenId];

        emit AuctionCancelled(tokenId);

        nft.transferFrom(address(this), seller, tokenId);
    }

    // Bid on an auction
    function bid(uint256 tokenId, uint256 amount) external {
        Auction storage auction = auctions[tokenId];

        // require(block.timestamp < auction.endTime, "Auction has ended");
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

        if (block.timestamp >= auction.endTime) {
            endAuction(tokenId);
        } else {
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

            paymentToken.transferFrom(
                auction.highestBidder,
                address(this),
                auction.highestBid
            );

            emit HighestBidIncreased(tokenId, msg.sender, amount);
        }
    }

    // End an auction and transfer NFT to the highest bidder
    function endAuction(uint256 tokenId) public {
        Auction storage auction = auctions[tokenId];

        address seller = auction.seller;

        require(block.timestamp >= auction.endTime, "Auction hasn't ended yet");
        require(auction.highestBid > 0, "No bids were placed");

        address winner = auction.highestBidder;
        uint256 winningBid = auction.highestBid;

        delete auctions[tokenId];

        nft.transferFrom(address(this), winner, tokenId);

        paymentToken.safeTransfer(seller, winningBid);

        emit AuctionEnded(tokenId, winner, winningBid);
    }
}
