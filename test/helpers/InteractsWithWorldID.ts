import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { poseidonContract } from 'circomlibjs'
import { ZkIdentity, Strategy } from '@zk-kit/identity'
import {
    Semaphore,
    generateMerkleProof,
    StrBigInt,
    MerkleProof,
    SemaphoreSolidityProof,
} from '@zk-kit/protocols'
import { solidityPack as pack } from 'ethers/lib/utils'

let semaphoreLibAddr: string
let WorldId: Contract

export const prepareWorldID = async (): Promise<void> => {
    semaphoreLibAddr = await _deploySemaphoreLibs()
}

export const setUpWorldID = async (): Promise<string> => {
    WorldId = await _deploySemaphore()

    const tx = await WorldId.createGroup(1, 20, 0)
    await tx.wait()

    return WorldId.address
}

export const registerIdentity = async () => {
    const identity = new ZkIdentity(Strategy.MESSAGE, 'test-identity')

    const tx = await WorldId.addMember(1, identity.genIdentityCommitment())
    await tx.wait()
}

export const registerInvalidIdentity = async () => {
    const tx = await WorldId.addMember(1, 1)
    await tx.wait()
}

export const getRoot = async (): Promise<BigInt> => {
    return WorldId.getRoot(1)
}

export const getProof = async (
    appId: string,
    action: string,
    signal: string
): Promise<[StrBigInt, SemaphoreSolidityProof]> => {
    const identity = new ZkIdentity(Strategy.MESSAGE, 'test-identity')
    const identityCommitment = identity.genIdentityCommitment()

    const witness = generateSemaphoreWitness(
        identity.getTrapdoor(),
        identity.getNullifier(),
        generateMerkleProof(20, BigInt(0), [identityCommitment], identityCommitment),
        hashBytes(pack(['uint256', 'string'], [hashBytes(pack(['string'], [appId])), action])),
        // update here if changing the signal (you might need to wrap in a `pack()` call if there are multiple arguments), see above
        signal
    )

    const { proof, publicSignals } = await Semaphore.genProof(
        witness,
        './build/semaphore.wasm',
        './build/semaphore_final.zkey'
    )

    return [publicSignals.nullifierHash, Semaphore.packToSolidityProof(proof)]
}

const generateSemaphoreWitness = (
    identityTrapdoor: StrBigInt,
    identityNullifier: StrBigInt,
    merkleProof: MerkleProof,
    externalNullifier: BigInt,
    signal: string
) => ({
    identityNullifier: identityNullifier,
    identityTrapdoor: identityTrapdoor,
    treePathIndices: merkleProof.pathIndices,
    treeSiblings: merkleProof.siblings,
    externalNullifier: externalNullifier,
    signalHash: hashBytes(signal),
})

const hashBytes = (signal: string): BigInt => {
    return BigInt(ethers.utils.solidityKeccak256(['bytes'], [signal])) >> BigInt(8)
}

const _deploySemaphoreLibs = async (): Promise<string> => {
    const poseidonABI = poseidonContract.generateABI(2)
    const poseidonBytecode = poseidonContract.createCode(2)

    const [signer] = await ethers.getSigners()

    const PoseidonLibFactory = new ethers.ContractFactory(poseidonABI, poseidonBytecode, signer)
    const poseidonLib = await PoseidonLibFactory.deploy()

    await poseidonLib.deployed()

    const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory(
        'IncrementalBinaryTree',
        {
            libraries: {
                PoseidonT3: poseidonLib.address,
            },
        }
    )
    const incrementalBinaryTreeLib = await IncrementalBinaryTreeLibFactory.deploy()

    await incrementalBinaryTreeLib.deployed()

    return incrementalBinaryTreeLib.address
}

const _deploySemaphore = async (): Promise<Contract> => {
    const SemaphoreFactory = await ethers.getContractFactory('Semaphore', {
        libraries: {
            IncrementalBinaryTree: semaphoreLibAddr,
        },
    })

    const contract = await SemaphoreFactory.deploy()

    await contract.deployed()

    return contract
}
