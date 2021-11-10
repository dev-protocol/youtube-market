/* eslint-disable capitalized-comments */
/* eslint-disable spaced-comment */
import { ethers } from 'hardhat'

async function main() {
	//!please check!!!!!!!!!
	const adminAddress = ''
	const khaosWallet = ''
	//!!!!!!!!!!!!!!!!!!!!!!

	// YouTubeMarket
	const youTubeMarketFactory = await ethers.getContractFactory('YouTubeMarket')
	const youTubeMarket = await youTubeMarketFactory.deploy()
	await youTubeMarket.deployed()

	const data = ethers.utils.arrayify('0x')

	// MarketProxy
	const marketProxyFactory = await ethers.getContractFactory('MarketProxy')
	const marketProxy = await marketProxyFactory.deploy(
		youTubeMarket.address,
		adminAddress,
		data
	)
	await marketProxy.deployed()

	const proxy = youTubeMarketFactory.attach(marketProxy.address)
	await proxy.initialize()
	await proxy.addKhaosRole(khaosWallet)

	console.log('youtube market deployed to:', youTubeMarket.address)
	console.log('market proxy deployed to:', marketProxy.address)
	console.log('market proxy khaosRole is attached to:', khaosWallet)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})

// memo
// set registryAddress and adminAddress and update .env file
// and execute this command
// npx hardhat run --network arbitrumRinkeby scripts/deploy.ts
