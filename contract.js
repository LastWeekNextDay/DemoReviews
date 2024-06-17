let contractABI;
let contract;

class ContractTransactions {
    async createAddAuthorizedEditorTransaction(initiator, editorAddress) {
        initiator = initiator.toLowerCase();
        editorAddress = editorAddress.toLowerCase();
        const data = contract.methods.addAuthorizedEditor(editorAddress).encodeABI();
        let gas = await contract.methods.addAuthorizedEditor(editorAddress).estimateGas({from: initiator});
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            from: initiator, to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createRemoveAuthorizedEditorTransaction(initiator, editorAddress) {
        initiator = initiator.toLowerCase();
        editorAddress = editorAddress.toLowerCase();
        const data = contract.methods.removeAuthorizedEditor(editorAddress).encodeABI();
        let gas = await contract.methods.removeAuthorizedEditor(editorAddress).estimateGas({from: initiator});
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            from: initiator, to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetAuthorizedEditorsTransaction() {
        const data = contract.methods.getAuthorizedEditors().encodeABI();
        let gas = await contract.methods.getAuthorizedEditors().estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createIsAuthorizedEditorTransaction(address) {
        address = address.toLowerCase();
        const data = contract.methods.isAuthorizedEditorAddress(address).encodeABI();
        let gas = await contract.methods.isAuthorizedEditorAddress(address).estimateGas({from: address});
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createUpdateInfoIPFSHashOfItemTransaction(address, itemName, ipfsHash) {
        address = address.toLowerCase();
        const data = contract.methods.updateInfoIPFSHashOfItem(itemName, ipfsHash).encodeABI();
        let gas = await contract.methods.updateInfoIPFSHashOfItem(itemName, ipfsHash).estimateGas({from: address});
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            from: address, to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetInfoIPFSHashOfItemTransaction(itemName) {
        const data = contract.methods.getInfoIPFSHashOfItem(itemName).encodeABI();
        let gas = await contract.methods.getInfoIPFSHashOfItem(itemName).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createAddReviewTransaction(address, domainName, itemName, comment, rating) {
        address = address.toLowerCase();
        const data = contract.methods.addReview(domainName, itemName, comment, rating).encodeABI();
        let gas = await contract.methods.addReview(domainName, itemName, comment, rating).estimateGas({from: address});
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            from: address, to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetDomainIDTransaction(domainName) {
        const data = contract.methods.getDomainID(domainName).encodeABI();
        let gas = await contract.methods.getDomainID(domainName).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetDomainByIDTransaction(domainID) {
        const data = contract.methods.getDomainByID(domainID).encodeABI();
        let gas = await contract.methods.getDomainByID(domainID).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetDomainTransaction(domainName) {
        const data = contract.methods.getDomain(domainName).encodeABI();
        let gas = await contract.methods.getDomain(domainName).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetDomainsTransaction() {
        const data = contract.methods.getDomains().encodeABI();
        let gas = await contract.methods.getDomains().estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetItemIDTransaction(itemName) {
        const data = contract.methods.getItemID(itemName).encodeABI();
        let gas = await contract.methods.getItemID(itemName).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetItemByIDTransaction(itemID) {
        const data = contract.methods.getItemByID(itemID).encodeABI();
        let gas = await contract.methods.getItemByID(itemID).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetItemTransaction(itemName) {
        const data = contract.methods.getItem(itemName).encodeABI();
        let gas = await contract.methods.getItem(itemName).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetItemsTransaction() {
        const data = contract.methods.getItems().encodeABI();
        let gas = await contract.methods.getItems().estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetReviewByIDTransaction(reviewID) {
        const data = contract.methods.getReviewByID(reviewID).encodeABI();
        let gas = await contract.methods.getReviewByID(reviewID).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetReviewsForDomainTransaction(domainName) {
        const data = contract.methods.getReviewsForDomain(domainName).encodeABI();
        let gas = await contract.methods.getReviewsForDomain(domainName).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetReviewsForDomainByIDTransaction(domainID) {
        const data = contract.methods.getReviewsForDomainByID(domainID).encodeABI();
        let gas = await contract.methods.getReviewsForDomainByID(domainID).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetReviewsForItemTransaction(itemName) {
        const data = contract.methods.getReviewsForItem(itemName).encodeABI();
        let gas = await contract.methods.getReviewsForItem(itemName).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetReviewsForItemByIDTransaction(itemID) {
        const data = contract.methods.getReviewsForItemByID(itemID).encodeABI();
        let gas = await contract.methods.getReviewsForItemByID(itemID).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetReviewsTransaction() {
        const data = contract.methods.getReviews().encodeABI();
        let gas = await contract.methods.getReviews().estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetUserReviewsTransaction(address) {
        address = address.toLowerCase();
        const data = contract.methods.getUserReviews(address).encodeABI();
        let gas = await contract.methods.getUserReviews(address).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetReviewsForItemOfDomainTransaction(domainName, itemName) {
        const data = contract.methods.getReviewsForItemOfDomain(domainName, itemName).encodeABI();
        let gas = await contract.methods.getReviewsForItemOfDomain(domainName, itemName).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createGetReviewsForItemIDOfDomainByIDTransaction(domainID, itemID) {
        const data = contract.methods.getReviewsForItemIDOfDomainByID(domainID, itemID).encodeABI();
        let gas = await contract.methods.getReviewsForItemIDOfDomainByID(domainID, itemID).estimateGas();
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }

    async createAddItemTransaction(initiator, itemName) {
        const data = contract.methods.addItem(itemName).encodeABI();
        let gas = await contract.methods.addItem(itemName).estimateGas({from: initiator});
        gas = BigInt(Math.ceil(Number(gas) * 1.2));
        return {
            from: initiator, to: process.env.CONTRACT_ADDRESS, gas: gas, data: data
        };
    }
}

function loadContract(web3Subscription) {
    const web3 = web3Subscription;

    // Initialize contract instance
    contractABI = JSON.parse(process.env.CONTRACT_ABI);
    contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);
    if (!contract) {
        throw new Error("Failed to initialize contract.");
    }

    return new ContractTransactions();
}

module.exports = {
    createContract: loadContract
};