/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import { HardhatUserConfig } from 'hardhat/config'
import * as dotenv from 'dotenv'

dotenv.config()

const mnemnoc =
	typeof process.env.MNEMONIC === 'undefined' ? '' : process.env.MNEMONIC

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.4',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		ropsten: {
			url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY!}`,
			gas: 4712388,
			accounts: {
				mnemonic: mnemnoc,
			},
		},
		arbitrumOne: {
			url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY!}`,
			accounts: {
				mnemonic: mnemnoc,
			},
		},
		arbitrumRinkeby: {
			url: `https://arbitrum-rinkeby.infura.io/v3/${process.env.INFURA_KEY!}`,
			accounts: {
				mnemonic: mnemnoc,
			},
		},
		polygonMainnet: {
			url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_KEY!}`,
			accounts: {
				mnemonic: mnemnoc,
			},
		},
		polygonMumbai: {
			url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_KEY!}`,
			accounts: {
				mnemonic: mnemnoc,
			},
		},
	},
}

export default config
