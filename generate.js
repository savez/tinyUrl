const crypto = require('crypto')
const base62 = require('base62/lib/ascii')
const validator = require('validator')
const { validate } = require("serverless-offline")
/**
 * Validate if URL meets syntax.
 * @param {string} str - The URL to be verified.
 * @returns {boolean} - Validity of str as URL
 */
const validateURL = (str) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$',
    'i'
  ) // fragment locator
  return !!pattern.test(str)
}

const validateDate = (str) => {
  const pattern = new RegExp('(0[1-9]|[12][0-9]|3[01])[- \\/.](0[1-9]|1[012])[- \\/.](19|20)\\d\\d'
  ) // fragment locator
  return !!pattern.test(str)
}

/**
 * Generate base62 character uuid.
 * @returns {string} - UUID string
 */
const generateUUID = () => base62.encode(parseInt(crypto.randomBytes(16).toString('hex'), 16)).substr(0, 6)

/**
 * Save item in database.
 * @param {} deps - The dyanmodb client settings.
 * @param {} tableName - The table name.
 * @param {} tinyId - The id used for inserting in the database.
 * @param {} url - The url value to be saved.
 * @returns {} - Response
 * @throws {} - Exception errors
 */
const saveItemInDB = (deps, tableName, tinyId, url) => {

  const params = {
    TableName: tableName,
    Item: {
      "Code": {
        S: tinyId
      },
      "UrlLong": {
        S: url
      }
    },
  }


  return deps.dbClient
    .putItem(params)
    .promise()
    .then((res) => {
      return res
    })
    .catch((err) => { throw err })
}


const getItemFromDB = (deps, tableName, id) => {
  const params = {
    TableName: tableName,
    Key: {
      "Code": {
        S: id
      },
    },
  }


  return deps.dbClient
    .getItem(params)
    .promise()
    .then((res) => res.Item)
    .catch((err) => err)
}

/**
 * Define json response.
 * @param {number} statusCode - The statusCode to return.
 * @param {} body - The body to respond users with.
 * @returns {} - Response
 */
const response = (statusCode, body) => ({
  statusCode: statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
  },
  body: JSON.stringify(body, null, 2),
})

/**
 * Validates request, put tinyUrl in database and return results or error.
 * @async
 * @param {} deps - The dbClient used.
 * @param {} event - The event of the accepted json request.
 * @returns {} - Response
 */
const generate = async (deps, event) => {
  const request = event
  const body = JSON.parse(request.body) || {}
  //body.originalUrl = encodeURIComponent(body.originalUrl)
  let validationErrors = await validateBody(body)

  if (validationErrors) {
    return validationErrors
  }
  // Generating uuid
  let tinyId = generateUUID()
  const tableName = process.env.DYNAMO_TABLE || 'shortUrlnerTable'
  // Saving request to DynamoDB and respond
  try {
    let tinyIsFree = false
    do {
      const tinyPresent = await getItemFromDB(deps, tableName, tinyId)
      if (tinyPresent) {
        tinyId = generateUUID()
      } else {
        tinyIsFree = true

      }
    } while (!tinyIsFree)

    body.count = 0
    body.timesToExpire = body.timesToExpire || 0
    body.status = body.status || 'ACTIVE'
    body.mode = body.mode || 'ETERNAL'
    let record = await saveItemInDB(deps, tableName, tinyId, JSON.stringify(body))
    if (record && record.statusCode) {
      return response(500, { message: record.name + ': ' + record.message })
    }
    return response(200, { tinyId: 'https://sntg.it/' + tinyId })
  } catch (err) {
    return response(500, { message: err.message })
  }
}

const validateBody = async (body) => {
  if (!body.originalUrl || validator.isEmpty(body.originalUrl)) {
    return response(422, { message: `Url is required` })
  }
  if (body.expiredDate) {
    if (!validateDate(body.expiredDate)) {
      return response(422, { message: `expiredDate malformed` })
    }

  }
  if (!body.redirectType) {
    return response(422, { message: `redirectType is required` })
  }
  if (!validator.contains(body.redirectType.toString(), '301') && !validator.contains(body.redirectType.toString(), '302')) {
    return response(422, { message: `redirectType is invalid. Valid values are 301,302` })
  }
  return null
}

module.exports = generate
