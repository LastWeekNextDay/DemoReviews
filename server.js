const {Web3} = require("web3");
const {createServerRequestsHandler} = require("./server_request_handlers");
const {InfuraIPFSInteractor, LocalIPFSInteractor} = require("./ipfs");
const {dateLog, loadLogger} = require("./logger");

async function main() {
    const dotenv = require('dotenv');
    const express = require('express');
    const bodyParser = require('body-parser');
    const cors = require('cors');

    // Load logger
    loadLogger();
    dateLog('Server started.');

    // Load environment variables
    dotenv.config();
    dateLog('Environment variables loaded.');

    // Check if all required environment variables are set
    if (!process.env.WEB3_ENDPOINT) {
        throw new Error('WEB3_ENDPOINT environment variable not set.');
    }
    if (!process.env.IPFS_MODE) {
        throw new Error('IPFS_MODE environment variable not set.');
    }
    if (!process.env.CONTRACT_ADDRESS) {
        throw new Error('CONTRACT_ADDRESS environment variable not set.');
    }
    if (!process.env.CONTRACT_ABI) {
        throw new Error('CONTRACT_ABI environment variable not set.');
    }
    if (!process.env.CONTRACT_OWNER) {
        throw new Error('CONTRACT_OWNER environment variable not set.');
    }
    if (!process.env.INFURA_API_KEY) {
        throw new Error('INFURA_API_KEY environment variable not set.');
    }
    dateLog('Environment variables checked.');

    // Initialize Web3
    const web3 = new Web3(process.env.WEB3_ENDPOINT);
    let res = await web3.eth.net.isListening();
    dateLog('Web3 connection: ', res);

    // Initialize IPFS
    let IPFSInteractor;
    if (process.env.IPFS_MODE.toLowerCase() === 'infura') {
        IPFSInteractor = new InfuraIPFSInteractor();
    } else if (process.env.IPFS_MODE.toLowerCase() === 'local') {
        IPFSInteractor = new LocalIPFSInteractor();
    } else {
        throw new Error('Invalid IPFS mode.');
    }
    dateLog('IPFS initialized.');

    // Create server request handlers
    const serverRequestHandlers = createServerRequestsHandler(web3, IPFSInteractor);
    dateLog('Server request handlers created.');

    // Initialize Express server
    const app = express();
    app.use(bodyParser.json({limit: '5mb'}));
    app.use(cors());
    dateLog('Express server initialized.');

    app.get('/ping', serverRequestHandlers.pingServer);

    app.post('/authorizedEditors/add', serverRequestHandlers.fetchAddAuthorizedEditorTransaction);

    app.delete('/authorizedEditors/:address/remove', serverRequestHandlers.fetchRemoveAuthorizedEditorTransaction);

    app.get('/authorizedEditors/:address?', serverRequestHandlers.fetchAuthorizedEditors);

    app.put('/items/:itemName/ipfs/update', serverRequestHandlers.fetchUpdateInfoIPFSHashOfItemTransaction);

    app.get('/items/:itemName/ipfs', serverRequestHandlers.fetchGetInfoIPFSHashOfItem);

    app.put('/items/:itemName/info/update', serverRequestHandlers.updateItemInfo);

    app.get('/items/:itemName/info', serverRequestHandlers.fetchItemInfo);

    app.get('/items/:itemName?', serverRequestHandlers.fetchItems);

    app.get('/items/id/:itemID', serverRequestHandlers.fetchItems);

    app.get('/items/:itemName/id', serverRequestHandlers.fetchItemID);

    app.get('/items/:itemName/domains', serverRequestHandlers.fetchDomains);

    app.get('/domains/:domainName?', serverRequestHandlers.fetchDomains);

    app.get('/domains/id', serverRequestHandlers.fetchDomains);

    app.get('/domains/:domainName/id', serverRequestHandlers.fetchDomainID);

    app.post("/reviews/:itemName/add", serverRequestHandlers.fetchAddReviewTransaction);

    app.get('/reviews/:itemName?', serverRequestHandlers.fetchReviews);

    app.get('/reviews/id/:reviewID?', serverRequestHandlers.fetchReviews)

    app.get('/reviews/user/:address', serverRequestHandlers.fetchReviews);

    app.get('/reviews/domains/:domainName', serverRequestHandlers.fetchReviews);

    app.get('/reviews/domains/:domainName/items/:itemName', serverRequestHandlers.fetchReviewsForItemOfDomain);

    app.get('/reviews/domains/:domainName/items/id/:itemID', serverRequestHandlers.fetchReviewsForItemOfDomain);

    app.get('/reviews/domains/id/:domainID/items/:itemName', serverRequestHandlers.fetchReviewsForItemOfDomain);

    app.get('/reviews/domains/id/:domainID/items/id/:itemID', serverRequestHandlers.fetchReviewsForItemOfDomain);


    app.listen(443, '0.0.0.0', () => {
        dateLog('Server running on port 443');
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
