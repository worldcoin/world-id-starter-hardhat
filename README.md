# World ID Starter Kit (Smart Contracts w/ Hardhat)

**Easiest** way to get started with World ID **on-chain**. This repository contains the minimum requirements to build web3 dApps with [World ID](#-about-world-id), allowing you to easily add sybil-resistance and uniqueness features to your dApp.

> This repository contains the smart contract code, and is built with the [Hardhat](https://hardhat.org) toolkit. We also have a Foundry version in the [world-id-starter](https://github.com/worldcoin/world-id-starter) repository.

## 🏃 Getting started

Start with the `verifyAndExecute` function on the [`Contract.sol`](contracts/Contract.sol) file, which contains the basic World ID logic. You can rename this function as you choose (for example, we use `claim` on our airdrop example).

### Setting your Action ID

The action ID (also called "external nullifier") makes sure that the proof your contract receives was generated for it. We recommend generating Action IDs on the [Developer Portal](https://developer.worldcoin.org) (more on [Action IDs](https://docs.worldcoin.org/id/anonymous-actions)).

> Note: Make sure you're passing the correct Action ID when initializing the JS widget! The generated proof will be invalid otherwise.

### Setting your signal

The signal adds an additional layer of protection to the World ID ZKP, it makes sure that the input provided to the contract is the one the person who generated the proof intended (more on [signals](https://docs.worldcoin.org/advanced/on-chain)). By default this contract expects an address (`receiver`), but you can update it to be any arbitrary string.

To update the signal, you should change the `input` on the `abi.encodePacked(input).hashToField()` line. You should provide the exact same string when initializing the JS widget, to make sure the proof includes them.

> Note: The `hashToField` part is really important, as validation will fail otherwise even with the right parameters. Make sure to include it!

### About nullifiers

_Nullifiers_ are what enforces uniqueness in World ID. You can generate multiple proofs for a given signal and action ID, but they will all have the same nullifier. Note how, in the `verifyAndExecute` function we first check if the given nullifier has already been used (and revert if so), then mark it as used after the proof is verified.

If your use-case doesn't require uniqueness, you can use them as "anonymous identifiers", linking users between different signals (for example, allowing them to change which address they've verified in a social network). To do this, update the `nullifierHashes` mapping to point to some sort of identifier instead of a boolean. See [this project](https://github.com/m1guelpf/lens-humancheck/blob/main/src/HumanCheck.sol) as an example.

## Advanced: Supporting multiple actions

The external nullifier makes sure that the proof your contract receives was generated for it, and not for a different contract using the same signal. Unless your use case requires users to perform more than one World ID action (claiming multiple airdrops that live in the same contract, for example, instead of a single one), you should use one Action ID, which you can obtain from the [Developer Portal](https://developer.worldcoin.org).

For advanced use cases, you can add additional arguments to the `abi.encodePacked` call to differentiate between actions, like so:

```solidity
function claimAirdrop(
    uint256 airdropId,
    address receiver,
    uint256 root,
    uint256 nullifierHash,
    uint256[8] calldata proof
) public {
    // ...

    worldId.verifyProof(
        root,
        groupId,
        abi.encodePacked(input).hashToField(),
        nullifierHash,
        abi.encodePacked(actionId, airdropId).hashToField(),
        proof
    );

    // ...
}

```

## 🗝 Usage instructions

1. End users will need a verified identity, which can be obtained through our [Simulator](https://simulator.worldcoin.org) ([see docs for more info](https://docs.worldcoin.org/try)). In production, this would be obtained by verifying with an orb.

2. Use the [JS widget](https://docs.worldcoin.org/idkit) to prompt the user with verification (make sure you're providing the correct [signal](#setting-your-signal) and [action ID](#setting-your-action-id)). Upon acceptance, you'll get a `merkle_root`, `nullifier_hash` and `proof`.

3. The ZKP (attribute `proof`) is a `uint256[8]` array and your smart contract expects it that way. For easier handling, the JS widget will return the proof encoded. Unpack your proof before sending it to your smart contract.

```js
import { defaultAbiCoder as abi } from '@ethers/utils'
const unpackedProof = abi.decode(['uint256[8]'], proof)[0]
// You can now pass your unpackedProof to your smart contract
```

4. Use the obtained parameters, along with any inputs your contract needs (which [should be included in the signal](#setting-your-signal)), to call your smart contract!

## 🧑‍💻 Development & testing

This repository uses the [Hardhat](https://hardhat.org) smart contract toolkit. You'll also need [Node.js](https://nodejs.org) v14 in order to build, and deploy your contract.

Once you have node installed, you can run `pnpm install` from the base directory to install all dependencies.

<!-- WORLD-ID-SHARED-README-TAG:START - Do not remove or modify this section directly -->
<!-- The contents of this file are inserted to all World ID repositories to provide general context on World ID. -->

## <img align="left" width="28" height="28" src="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/readme-world-id.png" alt="" style="margin-right: 0; padding-right: 4px;" /> About World ID

World ID is the privacy-first identity protocol that brings global proof of personhood to the internet. More on World ID in the [announcement blog post](https://worldcoin.org/blog/announcements/introducing-world-id-and-sdk).

World ID lets you seamlessly integrate authentication into your app that verifies accounts belong to real persons through [Sign in with Worldcoin](https://docs.worldcoin.org/id/sign-in). For additional flexibility and cases where you need extreme privacy, [Anonymous Actions](https://docs.worldcoin.org/id/anonymous-actions) lets you verify users in a way that cannot be tracked across verifications.

Follow the [Quick Start](https://docs.worldcoin.org/quick-start) guide for the easiest way to get started.

## 📄 Documentation

All the technical docs for the Wordcoin SDK, World ID Protocol, examples, guides can be found at https://docs.worldcoin.org/

<a href="https://docs.worldcoin.org">
  <p align="center">
    <picture align="center">
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/visit-documentation-dark.png" height="50px" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/worldcoin/world-id-docs/main/public/images/shared-readme/visit-documentation-light.png" height="50px" />
      <img />
    </picture>
  </p>
</a>

<!-- WORLD-ID-SHARED-README-TAG:END -->
