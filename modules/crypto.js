const rp = require("request-promise");

async function getValue(cryptoCode) {
    const requestOptions = {
        method: 'GET',
        uri: 'https://pro-api.coinmarketcap.com/v1/tools/price-conversion',
        qs: {
            'amount': '1',
            'symbol': cryptoCode,
            'convert': 'USD'
        },
        headers: {
            'X-CMC_PRO_API_KEY': '3e099a74-1a4b-4a6a-9092-190ae777739e'
        },
        json: true,
        gzip: true
    };

    const response = await rp(requestOptions);
    if (response.status.error_code !== 0) return 'unsupported';
    return response.data.quote.USD.price;
}

async function getPrice(cryptoCode, amount) {
    const requestOptions = {
        method: 'GET',
        uri: 'https://pro-api.coinmarketcap.com/v1/tools/price-conversion',
        qs: {
            'amount': amount,
            'symbol': cryptoCode,
            'convert': 'USD'
        },
        headers: {
            'X-CMC_PRO_API_KEY': '3e099a74-1a4b-4a6a-9092-190ae777739e'
        },
        json: true,
        gzip: true
    };

    const response = await rp(requestOptions);
    if (response.status.error_code !== 0) return 'unsupported';
    const val = await getValue(cryptoCode);
    return ({
        name: response.data.symbol,
        price: response.data.quote.USD.price,
        value: val
    });
}

module.exports = {
    getPrice
}
