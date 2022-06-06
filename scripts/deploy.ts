import { ethers } from 'hardhat'

const WORLD_ID_ADDRESS = '0x505Fd4741F00850024FBD3926ebECfB4c675A9fe'

async function main() {
    const ContractFactory = await ethers.getContractFactory('Contract')
    const contract = await ContractFactory.deploy(WORLD_ID_ADDRESS)

    await contract.deployed()

    console.log('Contract deployed to:', contract.address)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
