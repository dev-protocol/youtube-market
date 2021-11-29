/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
/* eslint-disable new-cap */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/naming-convention */

import { expect, use } from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { solidity } from 'ethereum-waffle'
import YouTubeMarketV2Artifact from '../artifacts/contracts/YouTubeMarketV2.sol/YouTubeMarketV2.json'
import MarketAdminArtifact from '../artifacts/contracts/MarketAdmin.sol/MarketAdmin.json'
import MarketProxyArtifact from '../artifacts/contracts/MarketProxy.sol/MarketProxy.json'
import { YouTubeMarketV2, MarketAdmin, MarketProxy } from '../typechain-types'

use(solidity)

const { deployContract, deployMockContract, provider } = waffle

type Signers = {
	deployer: SignerWithAddress
	khaos: SignerWithAddress
	user: SignerWithAddress
	associatedMarket: SignerWithAddress
}

type Markets = {
	deployer: YouTubeMarketV2
	khaos: YouTubeMarketV2
	user: YouTubeMarketV2
	associatedMarket: YouTubeMarketV2
}

const getSigners = async (): Promise<Signers> => {
	const [deployer, khaos, user, associatedMarket] = await ethers.getSigners()
	return {
		deployer,
		khaos,
		user,
		associatedMarket,
	}
}

const getMarketsWithoutAdmin = (markets: Markets): YouTubeMarketV2[] => [
	markets.khaos,
	markets.user,
	markets.associatedMarket,
]

const init = async (): Promise<Markets> => {
	const signers = await getSigners()
	const marketBehavior = (await deployContract(
		signers.deployer,
		YouTubeMarketV2Artifact
	)) as YouTubeMarketV2
	const admin = (await deployContract(
		signers.deployer,
		MarketAdminArtifact
	)) as MarketAdmin
	const data = ethers.utils.arrayify('0x')
	const proxy = (await deployContract(signers.deployer, MarketProxyArtifact, [
		marketBehavior.address,
		admin.address,
		data,
	])) as MarketProxy
	const YouTubeMarketV2Factory = await ethers.getContractFactory(
		YouTubeMarketV2Artifact.abi,
		YouTubeMarketV2Artifact.bytecode,
		signers.deployer
	)
	const proxyMarket = YouTubeMarketV2Factory.attach(
		proxy.address
	) as YouTubeMarketV2
	await proxyMarket.initialize()
	await proxyMarket.addKhaosRole(signers.khaos.address)
	return {
		deployer: proxyMarket,
		khaos: proxyMarket.connect(signers.khaos),
		user: proxyMarket.connect(signers.user),
		associatedMarket: proxyMarket.connect(signers.associatedMarket),
	}
}

const init2 = async (): Promise<Markets> => {
	const markets = await init()
	const signers = await getSigners()
	await markets.deployer.setAssociatedMarket(signers.associatedMarket.address)
	return markets
}

const init3 = async (): Promise<[Markets, string, string]> => {
	const markets = await init()
	const property = provider.createEmptyWallet()
	const signers = await getSigners()
	await markets.deployer.setAssociatedMarket(signers.associatedMarket.address)
	await markets.associatedMarket.authenticate(
		property.address,
		['user/repository', 'dummy-signature'],
		signers.user.address
	)
	const associatedMarket = await deployMockContract(signers.deployer, [
		{
			inputs: [
				{
					internalType: 'address',
					name: '_property',
					type: 'address',
				},
				{
					internalType: 'bytes32',
					name: '_idHash',
					type: 'bytes32',
				},
			],
			name: 'authenticatedCallback',
			outputs: [
				{
					internalType: 'address',
					name: '',
					type: 'address',
				},
			],
			stateMutability: 'nonpayable',
			type: 'function',
		},
	])
	await markets.deployer.setAssociatedMarket(associatedMarket.address)
	const metrics = provider.createEmptyWallet()
	const key = ethers.utils.keccak256(
		ethers.utils.toUtf8Bytes('user/repository')
	)

	await associatedMarket.mock.authenticatedCallback
		.withArgs(property.address, key)
		.returns(metrics.address)
	return [markets, property.address, metrics.address]
}

describe('YouTubeMarketV2', () => {
	describe('initialize', () => {
		describe('fail', () => {
			it('Cannot be executed multiple times.', async () => {
				const market = (await init()).deployer
				await expect(market.initialize()).to.be.revertedWith(
					'Initializable: contract is already initialized'
				)
			})
		})
	})

	describe('name', () => {
		it("Returns this market's name.", async () => {
			const market = (await init()).deployer
			expect(await market.name()).to.equal('YouTube')
		})
	})

	describe('schema', () => {
		it("Returns this market's schema.", async () => {
			const market = (await init()).deployer
			expect(await market.schema()).to.equal(
				'["YouTube Channel (e.g, UCN7m74tFgJJnoGL4zk6aJ6g)", "Khaos Public Signature"]'
			)
		})
	})
	describe('pause,unpause', () => {
		describe('success', () => {
			it('Admin can pause state.', async () => {
				const market = (await init()).deployer
				expect(await market.paused()).to.be.equal(false)
				await market.pause()
				expect(await market.paused()).to.be.equal(true)
				await market.unpause()
				expect(await market.paused()).to.be.equal(false)
			})
		})
		describe('fail', () => {
			it('non Admin can not pause state.', async () => {
				const markets = getMarketsWithoutAdmin(await init())
				for (const market of markets) {
					await expect(market.pause()).to.be.reverted
				}
			})
			it('non Admin can not unpause state.', async () => {
				const markets = getMarketsWithoutAdmin(await init())
				for (const market of markets) {
					await expect(market.unpause()).to.be.reverted
				}
			})
			it('Admin can not pause when pause state.', async () => {
				const market = (await init()).deployer
				await market.pause()
				await expect(market.pause()).to.be.revertedWith('Pausable: paused')
			})
			it('Admin can not unpause when unpause state.', async () => {
				const market = (await init()).deployer
				await expect(market.unpause()).to.be.revertedWith(
					'Pausable: not paused'
				)
			})
		})
	})
	describe('addKhaosRole, deleteKhaosRole', () => {
		describe('success', () => {
			it('add khaos role.', async () => {
				const market = (await init()).deployer
				const signers = await getSigners()
				const role = await market.KHAOS_ROLE()
				expect(await market.hasRole(role, signers.user.address)).to.be.equal(
					false
				)
				await market.addKhaosRole(signers.user.address)
				expect(await market.hasRole(role, signers.user.address)).to.be.equal(
					true
				)
			})
			it('delete khaos role.', async () => {
				const market = (await init()).deployer
				const signers = await getSigners()
				const role = await market.KHAOS_ROLE()
				expect(await market.hasRole(role, signers.khaos.address)).to.be.equal(
					true
				)
				await market.deleteKhaosRole(signers.khaos.address)
				expect(await market.hasRole(role, signers.khaos.address)).to.be.equal(
					false
				)
			})
		})
		describe('fail', () => {
			it('non Admin can not add khaos role.', async () => {
				const markets = getMarketsWithoutAdmin(await init())
				const signers = await getSigners()
				for (const market of markets) {
					await expect(market.addKhaosRole(signers.user.address)).to.be.reverted
				}
			})
			it('non Admin can not delete khaos role.', async () => {
				const markets = getMarketsWithoutAdmin(await init())
				const signers = await getSigners()
				for (const market of markets) {
					await expect(market.deleteKhaosRole(signers.khaos.address)).to.be
						.reverted
				}
			})
		})
	})
	describe('setAssociatedMarket', () => {
		describe('success', () => {
			it('set associated market.', async () => {
				const markets = await init()
				const signers = await getSigners()
				await markets.deployer.setAssociatedMarket(
					signers.associatedMarket.address
				)
				expect(await markets.deployer.associatedMarket()).to.be.equal(
					signers.associatedMarket.address
				)
			})
			it('set associated market again by some wallet.', async () => {
				const markets = await init()
				const signers = await getSigners()
				await markets.deployer.setAssociatedMarket(
					signers.associatedMarket.address
				)
				expect(await markets.deployer.associatedMarket()).to.be.equal(
					signers.associatedMarket.address
				)
				await markets.deployer.setAssociatedMarket(
					signers.associatedMarket.address
				)
				expect(await markets.deployer.associatedMarket()).to.be.equal(
					signers.associatedMarket.address
				)
			})
		})
		describe('fail', () => {
			it('can not reset associated market by other wallets.', async () => {
				const markets = await init()
				const signers = await getSigners()
				await markets.deployer.setAssociatedMarket(
					signers.associatedMarket.address
				)
				const otherMarkets = getMarketsWithoutAdmin(markets)
				for (const market of otherMarkets) {
					await expect(
						market.setAssociatedMarket(signers.associatedMarket.address)
					).to.be.revertedWith('illegal access')
				}
			})
		})
	})

	describe('authenticate', () => {
		describe('success', () => {
			it('Query event data is created.', async () => {
				const markets = await init2()
				const property = provider.createEmptyWallet()
				const signers = await getSigners()
				await expect(
					markets.associatedMarket.authenticate(
						property.address,
						['user/repository', 'dummy-signature'],
						signers.user.address
					)
				)
					.to.emit(markets.associatedMarket, 'Query')
					.withArgs('user/repository', 'dummy-signature', signers.user.address)
			})
		})
		describe('fail', () => {
			it('args length is not 2', async () => {
				const markets = await init2()
				const property = provider.createEmptyWallet()
				const signers = await getSigners()
				await expect(
					markets.associatedMarket.authenticate(
						property.address,
						['user/repository'],
						signers.user.address
					)
				).to.be.revertedWith('args error')
			})
			it('if status is pause, an error occurs.', async () => {
				const markets = await init2()
				await markets.deployer.pause()
				const property = provider.createEmptyWallet()
				const signers = await getSigners()
				await expect(
					markets.associatedMarket.authenticate(
						property.address,
						['user/repository', 'dummy-signature'],
						signers.user.address
					)
				).to.be.revertedWith('Pausable: paused')
			})
			it('Cannot be run from outside the associate market.', async () => {
				const markets = await init2()
				const property = provider.createEmptyWallet()
				const signers = await getSigners()
				for (const market of [markets.deployer, markets.khaos, markets.user]) {
					await expect(
						market.authenticate(
							property.address,
							['user/repository', 'dummy-signature'],
							signers.user.address
						)
					).to.be.revertedWith('invalid sender')
				}
			})
		})
	})
	describe('khaosCallback', () => {
		const getMarketsWithoutAdminAndKhaos = (
			markets: Markets
		): YouTubeMarketV2[] => [markets.user, markets.associatedMarket]
		const getAdminAndKhaosMarkets = (markets: Markets): YouTubeMarketV2[] => [
			markets.deployer,
			markets.khaos,
		]
		describe('success', () => {
			it('Authenticated event data is created.', async () => {
				const [markets] = await init3()
				const targetMarkets = getAdminAndKhaosMarkets(markets)
				for (const market of targetMarkets) {
					await expect(market.khaosCallback('user/repository', 0, ''))
						.to.emit(market, 'Authenticated')
						.withArgs('user/repository', '0', '')
				}
			})
			it('Registered event data is created.', async () => {
				const [markets, , metrics] = await init3()
				const targetMarkets = getAdminAndKhaosMarkets(markets)
				for (const market of targetMarkets) {
					await expect(market.khaosCallback('user/repository', 0, ''))
						.to.emit(market, 'Registered')
						.withArgs(metrics, 'user/repository')
				}
			})
			it('get id.', async () => {
				const [markets, , metrics] = await init3()
				const targetMarkets = getAdminAndKhaosMarkets(markets)
				for (const market of targetMarkets) {
					await market.khaosCallback('user/repository', 0, '')
					const id = await market.getId(metrics)
					expect(id).to.be.equal('user/repository')
				}
			})
			it('get metrics.', async () => {
				const [markets, , metrics] = await init3()
				const targetMarkets = getAdminAndKhaosMarkets(markets)
				for (const market of targetMarkets) {
					await market.khaosCallback('user/repository', 0, '')
					const result = await market.getMetrics('user/repository')
					expect(result).to.be.equal(metrics)
				}
			})
		})
		describe('fail', () => {
			it('illegal access', async () => {
				const [markets] = await init3()
				const targetMarkets = getMarketsWithoutAdminAndKhaos(markets)
				for (const market of targetMarkets) {
					await expect(
						market.khaosCallback('user/repository', 0, '')
					).to.be.revertedWith('illegal access')
				}
			})
			it('erroe status.', async () => {
				const [markets] = await init3()
				const market = markets.deployer
				await expect(
					market.khaosCallback('user/repository', 1, 'error message')
				).to.be.revertedWith('error message')
			})
			it('not authenticate.', async () => {
				const markets = await init2()
				const signers = await getSigners()
				await markets.deployer.setAssociatedMarket(
					signers.associatedMarket.address
				)
				const market = markets.deployer
				await expect(
					market.khaosCallback('user/repository', 0, '')
				).to.be.revertedWith('not while pending')
			})
		})
	})
})
