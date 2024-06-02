const axios = require('axios');

class IPFSInteractor {
    async saveToIPFS(data, name) {
        throw new Error("Method 'saveToIPFS()' must be implemented.");
    }

    async getFromIPFS(hash) {
        throw new Error("Method 'getFromIPFS()' must be implemented.");
    }
}

class InfuraIPFSInteractor extends IPFSInteractor {
    async saveToIPFS(jsonString, name) {
        const data = new FormData();
        const blob = new Blob([jsonString], {type: 'application/json'});
        data.append('file', blob, name + '.json');

        const response = await fetch("https://ipfs.infura.io:5001/api/v0/add", {
            method: "POST",
            body: data,
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.INFURA_API_KEY}:${process.env.INFURA_API_SECRET}`).toString('base64')}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to upload file to IPFS: ${response.statusText}`);
        }

        const json = await response.json();
        return json.Hash;
    }

    async getFromIPFS(hash) {
        const response = await fetch(`https://ipfs.infura.io:5001/api/v0/cat?arg=${hash}`);

        if (!response.ok) {
            throw new Error(`Failed to retrieve IPFS hash: ${hash}`);
        }

        return response.text();
    }
}

class LocalIPFSInteractor extends IPFSInteractor {
    constructor() {
        super();
        this.apiUrl = 'http://127.0.0.1:5001/api/v0';
    }

    async saveToIPFS(jsonString, name) {
        const form = new FormData();
        const blob = new Blob([jsonString], {type: 'application/json'});
        form.append('file', blob, `${name}.json`);

        const response = await axios.post(`${this.apiUrl}/add`, form, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${form._boundary}`
            }
        });

        if (response.status !== 200) {
            throw new Error(`Failed to upload data to IPFS: ${response.statusText}`);
        }

        const extractHash = (response, fileName) => {
            const lines = response.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                const parsed = JSON.parse(line);
                if (parsed.Name === `${fileName}.json`) {
                    return parsed.Hash;
                }
            }
            throw new Error(`Hash for file ${fileName}.json not found in response.`);
        };

        let hash;
        try {
            hash = extractHash(response.data, name);
        } catch (e) {
            hash = response.data.Hash;
        }

        if (!hash) {
            throw new Error('Failed to extract hash from IPFS response.');
        }

        return hash;
    }

    async getFromIPFS(hash) {
        const response = await axios.post(`${this.apiUrl}/cat?arg=${hash}`);

        if (response.status !== 200) {
            throw new Error(`Failed to retrieve IPFS hash: ${response.statusText}`);
        }

        return response.data;
    }
}

module.exports = {
    InfuraIPFSInteractor,
    LocalIPFSInteractor
};

