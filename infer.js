
const axios = require('axios').default
// const pythonApiUrl = 'http://td2:8030'
// const javascriptApiUrl = 'http://td2:8040'

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
