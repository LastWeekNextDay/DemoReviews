function getHostFromRequest(req) {
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
    return domain;
}

function compileReviews(decodedResult){
    let reviews = [];
    for (let i = 0; i < decodedResult[0].length; i++) {
        reviews.push({
            id: Number(decodedResult[0][i][0]),
            reviewer: decodedResult[0][i][1],
            itemName: decodedResult[0][i][2],
            domainName: decodedResult[0][i][3],
            comment: decodedResult[0][i][4],
            rating: Number(decodedResult[0][i][5])
        });
    }
    return reviews;
}

module.exports = {
    getHostFromRequest, compileReviews
};