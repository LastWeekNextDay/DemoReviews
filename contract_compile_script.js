const fs = require("fs").promises;
const solc = require("solc");

const contractName = process.argv[2];
if (!contractName) {
    console.error('Please provide a contract name.');
    process.exit(1); // Exit the process with a failure code
}
console.log("Compiling contract: " + contractName);

async function main(contractName) {
    // Load the contract source code
    const sourceCode = await fs.readFile("contracts/" + contractName + ".sol", "utf-8");
    // Compile the source code and retrieve the ABI and Bytecode
    const { abi, bytecode } = compile(sourceCode, contractName);
    // Store the ABI and Bytecode into a JSON file
    const artifact = JSON.stringify({ abi, bytecode }, null, 2);
    await fs.writeFile("contracts/" + contractName + ".json", artifact);
}

function compile(sourceCode, contractName) {
    // Create the Solidity Compiler Standard Input and Output JSON
    const input = {
        language: "Solidity",
        sources: { main: { content: sourceCode } },
        settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
    };
    // Parse the compiler output to retrieve the ABI and Bytecode
    const output = solc.compile(JSON.stringify(input));
    if (JSON.parse(output).errors) {
        console.error("Failed to compile the contract:", JSON.parse(output).errors);
        process.exit(1);
    }
    const artifact = JSON.parse(output).contracts.main[contractName];
    return {
        abi: artifact.abi,
        bytecode: artifact.evm.bytecode.object,
    };
}

main(contractName).then(() => console.log("Contract compiled successfully!"));