import { ethers } from "hardhat";

async function main() {

  const FuseERC20 = await ethers.getContractFactory("FuseERC20");
  const fuseERC20 = await FuseERC20.deploy();
  console.log({ fuseERC20: fuseERC20.address })

  await fuseERC20.deployed();

  const FuseNFT = await ethers.getContractFactory("FuseNFT");
  const fuseNFT = await FuseNFT.deploy();
  console.log({ fuseNFT: fuseNFT.address })

  await fuseNFT.deployed();

  const NFTAuction = await ethers.getContractFactory("NFTAuction");
  const nftAuction = await NFTAuction.deploy(fuseERC20.address, fuseNFT.address);
  console.log({ nftAuction: nftAuction.address })

  await nftAuction.deployed();

  await verifyContracts(
    fuseERC20.address,
    fuseNFT.address,
    nftAuction.address
  );
}

async function verifyContracts(fuseERC20, fuseNFT, nftAuction) {

  await verify(fuseERC20, "contracts/ERC20.sol:FuseERC20", []);
  await verify(fuseNFT, "contracts/ERC721.sol:FuseNFT", []);
  await verify(nftAuction, "contracts/marketplace.sol:NFTAuction", [fuseERC20.address, fuseNFT.address]);
}

async function verify(contractAddress: any, contract: string, args: any[]) {
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract,
    });
  } catch (error) {
    console.error(error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
