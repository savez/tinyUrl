/**
 * Save item in database.
 * @param {} deps - The dyanmodb client settings.
 * @param {} tableName - The table name.
 * @param {} tinyId - The id used for inserting in the database.
 * @param {} url - The url value to be saved.
 * @returns {} - Response
 * @throws {} - Exception errors
 */
const updateItemInDB = (deps, tableName, tinyId, item) => {

  const params = {
    TableName: tableName,
    Item: {
      "Code": {
        S: tinyId
      },
      "UrlLong": {
        S: item
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


/**
* Validate if tinyId meets syntax specified.
* @param {string} str - The tinyID to be verified.
* @returns {boolean} - Validity of str as TinyId
*/
const validateTinyId = (str) => {
  const pattern = new RegExp('^[a-zA-Z0-9]{0,22}$', 'i') // uuidv4 base62
  return !!pattern.test(str)
}

/**
 * Get item in database.
 * @param {} deps - The dyanmodb client settings.
 * @param {} tableName - The table name.
 * @param {} id - The id used to look up item in the database.
 * @returns {} - Response of Item from the database
 * @throws {} - Exception errors
 */
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
 * Define redirect response.
 * @param {number} statusCode - The statusCode to return.
 * @param {string} url - The url to redirect users to.
 * @returns {} - Redirect
 */
const redirect = (statusCode, url) => ({
  statusCode: statusCode,
  headers: {
    Location: url,
    'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
  },
  body: null
})

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
 * Accept request, lookup tinyUrl in database and return results or error.
 * @param {} deps - The dbClient used.
 * @param {} event - The event of the accepted json request.
 * @returns {} - Redirect or response
 */
//module.exports = (deps) => async (event) => {
const getter = async (deps, event) => {
  const request = event

  // Saving request to DynamoDB and respond
  if (
    request &&
    request.pathParameters &&
    request.pathParameters.proxy &&
    validateTinyId(request.pathParameters.proxy)
  ) {
    const tinyId = request.pathParameters.proxy
    const tableName = process.env.DYNAMO_TABLE || 'shortUrlnerTable'

    try {
      let record = await getItemFromDB(deps, tableName, tinyId)
      if (record && record.UrlLong) {
        const item = JSON.parse(record.UrlLong.S)

        if (item.status !== 'ACTIVE') {
          return redirect(301, process.env.URL_404)
        }

        item.count += 1
        switch (item.mode) {
          case 'EXPDATE':
            const today = new Date()
            const dateParts = item.expiredDate.split("/")
            // month is 0-based, that's why we need dataParts[1] - 1
            const expiredDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0])

            if (today > expiredDate) {
              return redirect(301, process.env.URL_404)
            }
            break
          case 'EXPCOUNTER':
            if (item.count === item.timesToExpire) {
              item.status = 'BURNT'
            }
            break
          case 'ETERNAL':
            break
        }


        await updateItemInDB(deps, tableName, tinyId, JSON.stringify(item))
        return redirect(item.redirectType, item.originalUrl)
      } else {
        if (record && record.statusCode) {
          const errorMsg = 'DyanmoDB: ' + record.name + ': ' + record.message
          if (record.statusCode >= 500) throw { message: errorMsg }
          return redirect(301, process.env.URL_404)
        }
        return redirect(301, process.env.URL_404)
      }
    } catch (err) {
      return redirect(301, process.env.URL_404)
    }
  } else {
    if (!request.pathParameters) {
      return redirect(301, process.env.URL_404)
    }
    return redirect(301, process.env.URL_404)
  }
}
module.exports = getter
