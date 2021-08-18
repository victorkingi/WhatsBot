const ocrSpace = require('ocr-space-api-wrapper')
const config = require('../config');


async function readImage (attachmentData) {
  try {    
    const res = await ocrSpace(`data:image/png;base64,${attachmentData.data}`, { apiKey: `${config.ocr_space_api_key}` })
    const parsedText = res["ParsedResults"][0]["ParsedText"];
    return ({
      parsedText: parsedText
    })
  } 
  catch (error) {
    return "error"
  }
}


module.exports = {
    readImage
}
