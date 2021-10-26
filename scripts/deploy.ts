/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ethers } from 'hardhat'

async function main() {
	//!please check!!!!!!!!!
	const registryAddress = ''
	//!!!!!!!!!!!!!!!!!!!!!!

	// YoutubeMarketParent
	const YoutubeMarketParentFactory = await ethers.getContractFactory('YoutubeMarketParent')
	const YoutubeMarketParent = await YoutubeMarketParentFactory.deploy()
	await YoutubeMarketParent.deployed()

	// MarketAdmin
	const marketAdminFactory = await ethers.getContractFactory('MarketAdmin')
	const marketAdmin = await marketAdminFactory.deploy()
	await marketAdmin.deployed()

	const data = ethers.utils.arrayify('0x')

	// MarketProxy
	const marketProxyFactory = await ethers.getContractFactory('MarketProxy')
	const marketProxy = await marketProxyFactory.deploy(
		YoutubeMarketParent.address,
		marketAdmin.address,
		data
	)
	await marketProxy.deployed()

	const proxy = YoutubeMarketParentFactory.attach(marketProxy.address)
	await proxy.initialize(registryAddress)

	console.log('github market deployed to:', YoutubeMarketParent.address)
	console.log('market admin deployed to:', marketAdmin.address)
	console.log('market proxy deployed to:', marketProxy.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
