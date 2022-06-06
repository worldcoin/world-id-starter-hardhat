import fs from 'fs'
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { poseidon_gencontract as poseidonContract } from 'circomlibjs'
import { ZkIdentity, Strategy } from '@zk-kit/identity'
import download from 'download'
import { config } from '../../package.json'
import {
    Semaphore,
    generateMerkleProof,
    StrBigInt,
    MerkleProof,
    SemaphoreSolidityProof,
} from '@zk-kit/protocols'

let WorldId: Contract

export const setUpWorldID = async (): Promise<string> => {
    await _downloadZKFiles()
    const { address: verifierAddress } = await _deployVerifier()
    WorldId = await _deploySemaphore(verifierAddress)

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
    externalNullifier: string,
    signal: string
): Promise<[StrBigInt, SemaphoreSolidityProof]> => {
    const identity = new ZkIdentity(Strategy.MESSAGE, 'test-identity')
    const identityCommitment = identity.genIdentityCommitment()

    const witness = generateSemaphoreWitness(
        identity.getTrapdoor(),
        identity.getNullifier(),
        generateMerkleProof(20, BigInt(0), [identityCommitment], identityCommitment),
        hashBytes(externalNullifier),
        // update here if changing the signal (you might need to wrap in a `pack()` call if multiple arguments)
        signal
    )

    const { proof, publicSignals } = await Semaphore.genProof(
        witness,
        '../../build/zk-files/20/semaphore.wasm',
        '../../build/zk-files/20/semaphore.zkey'
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

const _deployVerifier = async (): Promise<Contract> => {
    const ContractFactory = await ethers.getContractFactory(`Verifier20`)
    const contract = await ContractFactory.deploy()
    await contract.deployed()

    return contract
}
const _deploySemaphore = async (verifierAddress: string): Promise<Contract> => {
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

    const ContractFactory = await ethers.getContractFactory('Semaphore', {
        libraries: {
            IncrementalBinaryTree: incrementalBinaryTreeLib.address,
        },
    })

    const contract = await ContractFactory.deploy([
        { merkleTreeDepth: 20, contractAddress: verifierAddress },
    ])

    await contract.deployed()

    return contract
}

const _downloadZKFiles = async () => {
    const buildPath = config.paths.build['zk-files']
    const url = 'http://www.trusted-setup-pse.org/semaphore/semaphore.zip'

    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath, { recursive: true })
    }

    if (!fs.existsSync(`${buildPath}/16/semaphore.zkey`)) {
        await download(url, buildPath, {
            extract: true,
        })
    }
}
