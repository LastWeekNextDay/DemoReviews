const { Web3 } = require("web3");

const fs = require("fs");

const contractName = process.argv[2];
if (!contractName) {
    console.error('Please provide a contract name.');
    process.exit(1); // Exit the process with a failure code
}
console.log("Deploying contract: " + contractName);

async function main(contractName) {
    // Loading the contract ABI and Bytecode
    // (the results of a previous compilation step)
    const { abi, bytecode } = JSON.parse(fs.readFileSync("contracts/" + contractName + ".json", 'utf-8'));

    if (!process.env.ETHEREUM_NETWORK) {
        throw new Error('ETHEREUM_NETWORK environment variable not set.');
    }

    // Configuring the connection to an Ethereum node
    const network = process.env.ETHEREUM_NETWORK.toLowerCase();
    const web3 = new Web3(
        new Web3.providers.HttpProvider(
            `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`,
        ),
    );

    // Creating a signing account from a private key
    const signer = web3.eth.accounts.privateKeyToAccount(
        '0x' + process.env.CONTRACT_OWNER_PRIVATE_KEY,
    );
    web3.eth.accounts.wallet.add(signer);

    // Using the signing account to deploy the contract
    const contract = new web3.eth.Contract(abi);
    contract.options.data = bytecode;
    const deployTx = contract.deploy();
    const gasEstimate = await deployTx.estimateGas();
    const gasAsString = BigInt(gasEstimate * BigInt(2)).toString();
    const deployedContract = await deployTx
        .send({
            from: signer.address,
            gas: gasAsString,
        })
        .once("transactionHash", (txhash) => {
            console.log(`Mining deployment transaction ...`);
            console.log(`https://${network}.etherscan.io/tx/${txhash}`);
        })
        .catch((err) => {
            console.error("Failed to deploy:", err, "\nExiting...");
            process.exit(1);
        });

    // The contract is now deployed on chain!
    console.log(`Contract deployed at ${deployedContract.options.address}`);
}

require("dotenv").config();
main(contractName).then(() => console.log("Contract deployed successfully!"));