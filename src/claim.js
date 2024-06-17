"use strict";

import { createRequire } from 'module';
const require = createRequire(import.meta.url)
const fs = require('fs');
import Web3 from 'web3';

const contractABI = JSON.parse(fs.readFileSync("./src/abi/ZkMerkleDistributor.json", "utf8"));
const contractAddress = "0x66Fd4FC8FA52c9bec2AbA368047A0b27e24ecfe4";

var web3 = new Web3('https://rpc.ankr.com/zksync_era');
var contract = new web3.eth.Contract(contractABI, contractAddress)

// JSON dosyasını oku
const jsonData = fs.readFileSync("./src/proof.json");
const allocations = JSON.parse(jsonData).allocations;

async function sendClaimTransaction(index, amount, merkleProof, account, privateKey) {
    // claim metodunu çağırmak için gerekli verileri hazırla
    const data = contract.methods.claim(index, amount, merkleProof).encodeABI();

    // İşlem için gerekli parametreler
    const tx = {
        from: account,
        to: contractAddress,
        gas: 1000000,           // 1M gas
        gasPrice: 1000000000,   // 1 Gwei
        data: data
    };

    // İşlemi imzalayın ve gönderin
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction, "", { checkRevertBeforeSending: false });
    console.log('Transaction receipt:', receipt);
}

// Bütün allocations üzerinden geçerek claim metodunu çağır
async function processAllocations() {
    console.log("Processing allocations...")
    for (const allocation of allocations) {
        console.log(`Processing address: ${allocation.userId}`)
        const index = allocation.merkleIndex;
        const amount = allocation.tokenAmount;
        const merkleProof = allocation.merkleProof;
        const account = allocation.userId;
        const privateKey = allocation.pk;

        try {
            await sendClaimTransaction(index, amount, merkleProof, account, privateKey);
            console.log(`${allocation.userId} allocation processed successfully.`)
        } catch (error) {
            console.error(`Error processing ${allocation.userId} allocation ${index}:`, error);
        }
    }
}

processAllocations().then(() => {
    console.log('All allocations processed.');
}).catch((error) => {
    console.error('Error processing allocations:', error);
});