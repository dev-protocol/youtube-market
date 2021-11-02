/* eslint-disable capitalized-comments */
/* eslint-disable spaced-comment */
import { ethers } from 'hardhat'

async function main() {
	//!please check!!!!!!!!!
	const adminAddress = ''
	//!!!!!!!!!!!!!!!!!!!!!!

	// YouTubeMarketV2
	const youTubeMarketV2Factory = await ethers.getContractFactory('YouTubeMarketV2')
	const youTubeMarketV2 = await youTubeMarketV2Factory.deploy()
	await youTubeMarketV2.deployed()

	const data = ethers.utils.arrayify('0x')

	// MarketProxy
	const marketProxyFactory = await ethers.getContractFactory('MarketProxy')
	const marketProxy = await marketProxyFactory.deploy(
		youTubeMarketV2.address,
		adminAddress,
		data
	)
	await marketProxy.deployed()

	const proxy = youTubeMarketV2Factory.attach(marketProxy.address)
	await proxy.initialize()

	console.log('youtube market deployed to:', youTubeMarketV2.address)
	console.log('market proxy deployed to:', marketProxy.address)
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