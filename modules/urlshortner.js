// Coded by Sumanjay (https://github.com/cyberboysumanjay)
const axios = require('axios');

async function getShortURL(input) {
    const mainconfig = {
        method: 'get',
        url: `https://da.gd/s?url=${input}`
    };
    return axios(mainconfig)
        .then(async function (response) {
            const shortened = response.data;
            return ({
                input: input,
                short: shortened.replace(/\n/g, '')
            })
        })
        .catch(function (error) {
            return "error"
        })
}

module.exports = {
    getShortURL
}
