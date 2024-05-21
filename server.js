async function main() {
    const dotenv = require('dotenv');
    const axios = require('axios');
    const express = require('express');
    const bodyParser = require('body-parser');
    const {Web3} = require('web3');
    const pinataSDK = require('@pinata/sdk');
    const cors = require('cors');

    // Load environment variables
    dotenv.config();
    console.log('Environment variables loaded.');

    // Initialize Express server
    const app = express();
    app.use(bodyParser.json());
    app.use(cors());
    console.log('Express server initialized.');

    // Initialize Web3
    const web3 = new Web3(process.env.WEB3_ENDPOINT);
    let res = await web3.eth.net.isListening();
    console.log('Web3 connection: ', res);

    // Initialize contract instance
    const contractABI = JSON.parse(process.env.CONTRACT_ABI);
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    console.log('Contract initialized.');

    // Initialize Pinata
    const pinata = new pinataSDK({pinataJWTKey: process.env.PINATA_JWT, pinataSecretApiKey: process.env.PINATA_SECRET});
    res = await pinata.testAuthentication();
    console.log('Pinata initialization: ', res);

    // Function to retrieve IPFS data
    async function getIPFSData(ipfsHash) {
        try {
            // If an existing IPFS hash is provided, retrieve data
            if (ipfsHash) {
                console.log("Retrieving existing IPFS data.")

                let found = false;

                const filter = {
                    status: "pinned",
                }

                // Check if the IPFS hash exists
                const pinList = await pinata.pinList(filter);
                if (pinList.rows) {
                    found = pinList.rows.some(row => row.ipfs_pin_hash === ipfsHash);
                }

                if (!found) {
                    console.log("IPFS hash not found.")
                    return [];
                }

                let res;
                try {
                    res = await axios.get(process.env.PINATA_GATEWAY + "/ipfs/" + ipfsHash);
                } catch (error) {
                    console.error("Error retrieving IPFS data:", error);
                    return [];
                }

                console.info("Fetched IPFS Data:\n", res.data)

                if (res.data) {
                    console.log("Retrieved existing reviews:\n", res.data);
                    return res.data;
                } else {
                    console.log("No existing reviews found.");
                    return [];
                }
            } else {
                console.log("IPFS hash not provided.");
                return [];
            }
        } catch (error) {
            console.error("Error retrieving IPFS data:", error);
            return [];
        }
    }

    // Function to lookup IPFS data
    async function lookupIPFSData(name) {
        const filter = {
            status: "pinned",
            name: name
        }

        console.log("Looking up IPFS data for ", name)

        res = await pinata.pinList(filter);
        let hash = "";
        let found = false;
        for (let row of res.rows) {
            if (row.metadata.name === "DomainMapping") {
                found = true;
                hash = row.ipfs_pin_hash;
            }
        }

        return {found, hash};
    }

    // Function to remove items from domain
    async function removeItemsFromIPFSDomain(domain, items) {
        let {found, hash} = await lookupIPFSData("DomainMapping");

        if (!found) {
            console.log("Domain mapping not found.");
            return;
        }

        try {
            res = await axios.get(process.env.PINATA_GATEWAY + "/ipfs/" + hash);
            let domMapping = res.data;

            if (domMapping[domain]) {
                domMapping[domain] = domMapping[domain].filter(item => !items.includes(item));
            }

            res = await pinata.unpin(hash);

            let options = {
                pinataMetadata: {
                    name: "DomainMapping"
                }
            }

            res = await pinata.pinJSONToIPFS(domMapping, options);
            console.log("Updated domain mapping:\n", domMapping);
        } catch (error) {
            console.error("Error removing items from domain:", error);
        }
    }

    // Function to update IPFS domain to reviews mapping
    async function updateIPFSDomain(domain, listOfItems) {
        let {found, hash} = await lookupIPFSData("DomainMapping");

        const options = {
            pinataMetadata: {
                name: "DomainMapping"
            }
        }

        let domMapping = {}

        if (!found) {
            domMapping[domain] = listOfItems;
        } else {
            let res = await axios.get(process.env.PINATA_GATEWAY + "/ipfs/" + hash);
            domMapping = res.data;
            if (domMapping[domain]) {
                for (let item of listOfItems) {
                    if (!domMapping[domain].includes(item)) {
                        domMapping[domain].push(item);
                    }
                }
            } else {
                domMapping[domain] = listOfItems;
            }

            // Unpin previous data
            res = await pinata.unpin(hash);
            console.log("Unpinning previous domain mapping:", res);
        }

        console.log("Pinning domain mapping:\n", domMapping);
        let res = await pinata.pinJSONToIPFS(domMapping, options);
        console.log("Response from pinning domain mapping:", res);
    }

    // Function to update or create IPFS reviews
    async function updateIPFSReviews(ipfsHash, newReview, metadataName = "Reviews") {
        let reviews = [];
        if (ipfsHash) {
            reviews = await getIPFSData(ipfsHash);

            // If IPFS contains data
            if (reviews.length > 0) {
                // Unpin previous data
                let res = await pinata.unpin(ipfsHash);
                console.log("Unpinning previous data:", res);

                // Check if the wallet already contains a review for this item
                const existingReview = reviews.find(review => review.walletAddr === newReview.walletAddr);
                if (existingReview) {
                    console.log("User has already submitted a review for this item.");

                    // Remove existing review
                    reviews = reviews.filter(review => review.walletAddr !== newReview.walletAddr);

                    console.log("Removed existing review:\n", existingReview);
                }
            }
        }

        console.log("Adding new review:\n", newReview);

        // Add new review
        reviews.push(newReview);

        // Store the updated data
        let options = {
            pinataMetadata: {
                name: metadataName
            }
        }

        let res = await pinata.pinJSONToIPFS(reviews, options);

        let newCid = res.IpfsHash;

        console.log("Updated reviews:\n", reviews);

        console.log("New IPFS hash:", newCid);

        return newCid;
    }

    app.get('/ping', (req, res) => {
        console.log('Ping from', req.ip);
        res.json({success: true, message: 'Pong'});
    });

    app.get('/getItemReviews', async (req, res) => {
        console.log(req.query)

        const {itemName, domainName} = req.query;

        if (!itemName && !domainName) {
            return res.status(400).json({success: false, message: 'Missing required query parameter'});
        }

        if (domainName) {
            console.log("Looking up domain mapping for ", domainName)
            let {found, hash} = await lookupIPFSData("DomainMapping");

            if (!found) {
                console.log("Domain mapping not found.");
                return res.status(404).json({success: false, message: 'Domain not found'});
            } else {
                console.log("Retrieving domain mapping data.")
                let axiosRes = await axios.get(process.env.PINATA_GATEWAY + "/ipfs/" + hash);
                let domMapping = axiosRes.data;

                console.log("Domain mapping:\n", domMapping);

                if (domMapping[domainName]) {
                    console.log("Getting reviews for domain ", domainName)
                    let items = domMapping[domainName];
                    let reviews = [];
                    for (let item of items) {
                        if (itemName) {
                            if (item !== itemName) {
                                continue;
                            }
                        }
                        let ipfsHash = await contract.methods.getItemIPFSHash(item).call();
                        let itemReviews = await getIPFSData(ipfsHash);
                        itemReviews = itemReviews.filter(review => review.domain === domainName);
                        reviews.push(...itemReviews);
                    }

                    res.json(reviews);
                } else {
                    console.log("Domain not found.");
                    return res.status(404).json({success: false, message: 'Domain not found'});
                }
            }
        } else {
            // Get the existing IPFS hash from the contract
            console.log("Getting IPFS hash.")
            let currentIPFSHash = await contract.methods.getItemIPFSHash(itemName).call();
            console.log("IPFS hash:", currentIPFSHash);

            // Retrieve the reviews from IPFS
            let reviews = await getIPFSData(currentIPFSHash);

            // Send back the reviews
            res.json(reviews);
        }
    });

    /**
     * @param {string} review.starRating
     * @param {string} review.comment
     * @param {string} review.walletAddress
     */
    app.post('/uploadReview', async (req, res) => {
        console.log(req.body)

        const {itemName, review, tx} = req.body;

        console.log("Received review.")
        console.log("Item name:", itemName)
        console.log("Review:", review)
        console.log("Transaction:", tx)

        if (!itemName || !tx || !review) {
            console.error("Missing required parameters.")
            return res.status(400).json({success: false, message: 'Missing required parameters'});
        }

        try {
            if (!tx.status) {
                console.error("Invalid transaction receipt.")
                return res.status(400).json({success: false, message: 'Invalid transaction receipt'});
            } else {
                if (tx.from.toLowerCase() !== review.walletAddress.toLowerCase()) {
                    console.error("Transaction not done by reviewer.")
                    return res.status(400).json({success: false, message: 'Transaction not done by reviewer'});
                }
            }

            console.log("Trying to get hash.")

            // Get the existing IPFS hash from the contract
            let currentIPFSHash = await contract.methods.getItemIPFSHash(itemName).call();

            console.log("Current IPFS hash:", currentIPFSHash)

            console.log("Getting domain name.")

            // Fix domain name
            let domain = req.get('origin');
            if (domain) {
                if (domain.includes("://")) {
                    domain = domain.split('://')[1];
                }
            } else {
                domain = req.get('hostname')
                if (!domain) {
                    domain = "Unknown";
                }
            }

            // Create a new review object
            const newReview = {
                walletAddr: review.walletAddress,
                score: review.starRating,
                domain: domain,
                commentary: review.comment,
                timestamp: Date.now()
            };

            console.log("Updating IPFS reviews data.")

            // Update the IPFS file with the new review
            const newIPFSHash = await updateIPFSReviews(currentIPFSHash, newReview, itemName);

            console.log("Updating IPFS domain mapping.")
            await updateIPFSDomain(newReview.domain, [itemName]);

            console.log("Updating contract.")

            const gas = await contract.methods.modifyItemIPFSHash(itemName, newIPFSHash).estimateGas({from: process.env.CONTRACT_OWNER});
            const gasPrice = await web3.eth.getGasPrice();

            const tx2 = {
                from: process.env.CONTRACT_OWNER,
                to: contractAddress,
                gas: gas,
                gasPrice: gasPrice,
                data: contract.methods.modifyItemIPFSHash(itemName, newIPFSHash).encodeABI()
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx2, process.env.CONTRACT_OWNER_PRIVATE_KEY);

            // Update the smart contract with the new IPFS hash
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

            if (receipt.status) {
                console.log("Contract updated successfully.")
                console.log("Review submitted successfully.")
            } else {
                console.error("Error updating contract.")
                console.error("Error submitting review.")
                return res.status(500).json({success: false, message: "Error updating contract"});
            }

            // Send back the new IPFS hash
            res.json({success: true, ipfsHash: newIPFSHash});
        } catch (error) {
            console.error("Error submitting review:", error);
            res.status(500).json({success: false, message: "Error submitting review to IPFS"});
        }
    });

    app.listen(443, '0.0.0.0', () => {
        console.log('Server running on port 443');
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
