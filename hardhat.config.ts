import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-test-suite-generator";

// const defaultNetwork = 'fuse';

// export const targetNetworkInfo: TNetworkInfo = NETWORKS.fuse;

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    fuse: {
      url: "https://rpc.fusespark.io",
      chainId: 123,
      accounts: ["0bd2d6cbc72d69f03e0772ebd5366f082c6b2e7da6ad97d4272a013bc8d13061"]

    }
  },
  // customChains: [
  //   {
  //     network: "fuse",
  //     chainId: 123,
  //     urls: {
  //       apiURL: "https://api-goerli.etherscan.io/api",
  //       browserURL: "https://goerli.etherscan.io"
  //     }
  //   }
  // ]
  etherscan: {
    apiKey: {
      fuse: "a8efec3e-8891-4741-9809-981047c82f5d",
    },
    customChains: [
      {
        network: "fuse",
        chainId: 123,
        urls: {
          apiURL: "https://rpc.fuse.io/",
          browserURL: "https://explorer.fusespark.io",
        }
      }
    ]
  },
};

export default config;
