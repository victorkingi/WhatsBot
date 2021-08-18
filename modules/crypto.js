// Coded by Sumanjay (https://github.com/cyberboysumanjay)
const axios = require('axios');

async function getPrice(cryptoCode) {
    cryptoCode = cryptoCode.toUpperCase()
    const mainconfig = {
        method: 'get',
        url: 'https://public.coindcx.com/market_data/current_prices'
    };
    return axios(mainconfig)
        .then(async function (response) {
            const data = response.data;
            const cryptoCodeINR = cryptoCode + "USDT";
            if (data[cryptoCode] !== undefined || data[cryptoCodeINR] !== undefined) {
                cryptoCode = data[cryptoCode] === undefined ? cryptoCodeINR : cryptoCode
                return ({
                    name: cryptoCode,
                    price: data[cryptoCode]
                })
            } else {
                return "unsupported"
            }
        })
        .catch(function (error) {
            return "error"
        })
}

module.exports = {
    getPrice
}
