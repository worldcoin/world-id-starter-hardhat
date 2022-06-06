import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import {
    getProof,
    getRoot,
    registerIdentity,
    registerInvalidIdentity,
    setUpWorldID,
} from './helpers/InteractsWithWorldID'

describe('Contract', function () {
    let Contract: Contract

    beforeEach(async () => {
        const worldIDAddress = await setUpWorldID()
        const ContractFactory = await ethers.getContractFactory('Contract')
        Contract = await ContractFactory.deploy(worldIDAddress)
        await Contract.deployed()
    })

    it('Accepts and validates calls', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(Contract.address, this.address)

        const tx = await Contract.verifyAndExecute(
            this.address,
            await getRoot(),
            nullifierHash,
            proof
        )
        await expect(tx).to.not.be.reverted

        // extra checks here
    })

    it('Rejects duplicated calls', async function () {
        await registerIdentity()

        //
    })
    it('Rejects calls from non-members', async function () {
        await registerInvalidIdentity()

        //
    })
    it('Rejects calls with an invalid signal', async function () {
        await registerIdentity()

        //
    })
    it('Rejects calls with an invalid proof', async function () {
        await registerIdentity()

        //
    })
})
