import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, use } from "chai";
import { ethers } from "hardhat";
import { FuseERC20, FuseNFT, NFTAuction } from "../typechain-types";
import { marketplaceSol } from "../typechain-types/contracts";

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  let owner: any;
  let user1: any;
  let user2: any;
  let Erc20: FuseERC20;
  let NFT: FuseNFT;
  let Marketplace: NFTAuction;

  before(async () => {
    const erc20 = await ethers.getContractFactory("FuseERC20");
    Erc20 = await erc20.deploy();

    const nft = await ethers.getContractFactory("FuseNFT");
    NFT = await nft.deploy();

    const marketplace = await ethers.getContractFactory("NFTAuction");
    Marketplace = await marketplace.deploy(NFT.address, Erc20.address);

    [ owner, user1, user2 ] = await ethers.getSigners();
  })

  describe(" Marketplace Testing", async function() {
    it("Should be able to create an Auction", async () => {

      const mintERC20 = await Erc20.mint(owner.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 1);

      await NFT.approve(Marketplace.address, 1);

      const auction = await Marketplace.createAuction( 1, 10, 120);

      await expect(auction).to.emit(Marketplace, 'AuctionCreated').withArgs( 1, 10, await time.latest()+120);
    });

    it(" Should be able to cancel Auction", async () => {
      const cancel = await Marketplace.cancelAuction(1);

      await expect(cancel).to.emit( Marketplace ,"AuctionCancelled").withArgs( 1 );
    });

    it(" should be able to bid", async () => {
      const mintERC20 = await Erc20.mint(user1.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 2);

      await NFT.approve(Marketplace.address, 2);

      await Erc20.connect(user1).approve(Marketplace.address,11);

      const auction = await Marketplace.createAuction( 2, 10, 120);

      const bid = await Marketplace.connect(user1).bid(2, 11);

      await expect(bid).to.emit(Marketplace, "HighestBidIncreased").withArgs(2, user1.address, 11);
    });

    it("should be able to end Auction", async () => {
      await time.increase(1000);

      const end = await Marketplace.endAuction(2);

      await expect(end).to.emit(Marketplace, "AuctionEnded").withArgs(2, user1.address, 11);

    });

    it("Should not create Auction if sender is not the owner of the nft", async () => {
      const mintNFT = await NFT.safeMint(owner.address, 3);

      await NFT.approve(Marketplace.address, 3);
      await expect( Marketplace.connect(user1).createAuction( 3, 10, 120)
      ).to.be.revertedWith("You don't own the NFT");
    });

    it("Should not create Auction if price is below 0", async () => {
      const mintNFT = await NFT.safeMint(owner.address, 4);

      await NFT.approve(Marketplace.address, 4);

      await expect( Marketplace.createAuction( 4, 0, 120)
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("Should not create Auction if duration is less than a minute", async () => {
      const mintNFT = await NFT.safeMint(owner.address, 5);

      await NFT.approve(Marketplace.address, 5);

      await expect( Marketplace.createAuction( 5, 11, 20)
      ).to.be.revertedWith("Duration must be at least 1 minute");
    });

    it("Should not create Auction if duration is less than a minute", async () => {
      const mintNFT = await NFT.safeMint(owner.address, 6);

      await expect( Marketplace.createAuction( 6, 11, 120)
      ).to.be.revertedWith("Contract not approved for NFT");
    });

    it(" Should not be able to cancel Auction if sender is not seller", async () => {

      await expect(Marketplace.connect(user1).cancelAuction(3)).to.be.revertedWith("You're not the seller")
    });

    it(" Should not be able to cancel Auction if sender is not seller", async () => {

      const mintERC20 = await Erc20.mint(user1.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 7);

      await NFT.approve(Marketplace.address, 7);

      await Erc20.connect(user1).approve(Marketplace.address,11);

      const auction = await Marketplace.createAuction( 7, 10, 120);

      const bid = await Marketplace.connect(user1).bid(7, 11);

      await expect(Marketplace.cancelAuction(7)).to.be.revertedWith("Auction already has bids")
    });

    it("Should not be able to bid if amount is lee than auction price", async () => {
      const mintERC20 = await Erc20.mint(user1.address, 100);

      const mintNFT = await NFT.safeMint(owner.address, 9);

      await NFT.approve(Marketplace.address, 9);

      await Erc20.connect(user1).approve(Marketplace.address,11);

      const auction = await Marketplace.createAuction( 9, 10, 120);

      await expect(Marketplace.connect(user1).bid(9, 9)).to.be.rejectedWith("Bid must be greater than or equal to the current price");
    });

    it("Should not be able to bid if amount is lee than auction price", async () => {
      const mintERC20 = await Erc20.mint(user1.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 10);

      await NFT.approve(Marketplace.address, 10);

      await Erc20.connect(user1).approve(Marketplace.address,11);

      const auction = await Marketplace.createAuction( 10, 10, 120);

      await expect(Marketplace.bid(10, 11)).to.be.rejectedWith("Seller cannot bid on their own auction");
    });

    it("Should not be able to bid if amount is less than highest bid", async () => {
      const mintERC20User1 = await Erc20.mint(user1.address, 100);
      const mintERC20User2 = await Erc20.mint(user2.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 11);

      await NFT.approve(Marketplace.address, 11);

      await Erc20.connect(user1).approve(Marketplace.address,12);
      await Erc20.connect(user2).approve(Marketplace.address,11);

      const auction = await Marketplace.createAuction( 11, 10, 120);

      const bid1 = await Marketplace.connect(user1).bid(11, 12)

      await expect(Marketplace.connect(user2).bid(11, 11)).to.be.rejectedWith("Bid must be greater than the highest bid");
    });
    
    it("Should be able to end auction if block.timestamp is greater than endtime", async () => {
      const mintERC20User1 = await Erc20.mint(user1.address, 100);
      const mintERC20User2 = await Erc20.mint(user2.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 12);

      await NFT.approve(Marketplace.address, 12);

      await Erc20.connect(user1).approve(Marketplace.address,12);
      await Erc20.connect(user2).approve(Marketplace.address,11);

      const auction = await Marketplace.createAuction( 12, 10, 120);

      const bid = await Marketplace.connect(user2).bid(12, 11)

      await time.increase(1000);


      const bid1 = await Marketplace.connect(user1).bid(12, 12)

      await expect(bid1).to.emit(Marketplace, "AuctionEnded").withArgs(12, user2.address, 11);
    });

    it("Should be able to bid and transfer the amount to previous highest bidder", async () => {
      const mintERC20User1 = await Erc20.mint(user1.address, 100);
      const mintERC20User2 = await Erc20.mint(user2.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 13);

      await NFT.approve(Marketplace.address, 13);

      await Erc20.connect(user1).approve(Marketplace.address,12);
      await Erc20.connect(user2).approve(Marketplace.address,11);

      const auction = await Marketplace.createAuction( 13, 10, 120);

      const balance1 = await Erc20.balanceOf(user2.address);

      const bid1 = await Marketplace.connect(user2).bid(13, 11)

      const bid2 = await Marketplace.connect(user1).bid(13, 12)

      const balance2 = await Erc20.balanceOf(user2.address);

      expect(balance1).to.be.equal(balance2);
    });

    it("should not be able to end Auction if block.timestamp is greater thatn endtime", async () => {
      const mintERC20User1 = await Erc20.mint(user1.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 14);

      await NFT.approve(Marketplace.address, 14);

      await Erc20.connect(user1).approve(Marketplace.address,12);

      const auction = await Marketplace.createAuction( 14, 10, 120);

      const bid1 = await Marketplace.connect(user1).bid(14, 11)

      await expect(Marketplace.endAuction(14)).to.be.revertedWith("Auction hasn't ended yet");

    });

    it("should not be able to end Auction if there are no bids places", async () => {
      const mintERC20User1 = await Erc20.mint(user1.address, 100);
      const mintNFT = await NFT.safeMint(owner.address, 15);

      await NFT.approve(Marketplace.address, 15);

      await Erc20.connect(user1).approve(Marketplace.address,12);

      const auction = await Marketplace.createAuction( 15, 10, 120);

      await time.increase(1000);

      await expect(Marketplace.endAuction(15)).to.be.revertedWith("No bids were placed");

    });
  });
});
