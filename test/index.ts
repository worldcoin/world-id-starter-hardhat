import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import {
    getProof,
    getRoot,
    prepareWorldID,
    registerIdentity,
    registerInvalidIdentity,
    setUpWorldID,
} from './helpers/InteractsWithWorldID'

const APP_ID = 'app_1234'
const ACTION = 'wid_test_1234'

describe('Contract', function () {
    let Contract: Contract
    let callerAddr: string

    this.beforeAll(async () => {
        await prepareWorldID()
    })

    beforeEach(async () => {
        const [signer] = await ethers.getSigners()
        const worldIDAddress = await setUpWorldID()
        const ContractFactory = await ethers.getContractFactory('Contract')
        Contract = await ContractFactory.deploy(worldIDAddress, APP_ID, ACTION)
        await Contract.deployed()

        callerAddr = await signer.getAddress()
    })

    it('Accepts and validates calls', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(APP_ID, ACTION, callerAddr)

        const tx = await Contract.verifyAndExecute(
            callerAddr,
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx.wait()

        // extra checks here
    })

    it('Rejects duplicated calls', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(APP_ID, ACTION, callerAddr)

        const tx = await Contract.verifyAndExecute(
            callerAddr,
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx.wait()

        await expect(
            Contract.verifyAndExecute(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidNullifier')

        // extra checks here
    })
    it('Rejects calls from non-members', async function () {
        await registerInvalidIdentity()

        const [nullifierHash, proof] = await getProof(APP_ID, ACTION, callerAddr)

        await expect(
            Contract.verifyAndExecute(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
    it('Rejects calls with an invalid signal', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(APP_ID, ACTION, callerAddr)

        await expect(
            Contract.verifyAndExecute(Contract.address, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
    it('Rejects calls with an invalid proof', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(APP_ID, ACTION, callerAddr)
        proof[0] = (BigInt(proof[0]) ^ BigInt(42)).toString()

        await expect(
            Contract.verifyAndExecute(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
})
