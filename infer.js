
const axios = require('axios').default

/**
 * @param {string} api server of api
 * @param {object} context context to predict
 * @param {string} pkv_name
 * @returns {Promise<string>}
 */
async function infer(api, context, pkv_name=null) {
    console.log('send to server', api)
    const ret = await axios.post(api, {
        context,
        pkv_name
    })
    return ret.data.text
}

module.exports = {
    infer
}
