const { Client } = require('pg');
const client = new Client({
	user: process.env.USER,
	host: process.env.HOST,
	database: process.env.DATABASE,
	password: process.env.PASSWORD,
	port: process.env.PORT
});
const TABLE_NAME = process.env.TABLE_NAME;

class Response {
	constructor(statusCode, isBase64Encoded, body, headers) {
		this.statusCode = statusCode;
		this.isBase64Encoded = isBase64Encoded;
		this.body = JSON.stringify(body);
		this.headers = headers
	}
}

/* 簡単なバリデーションで実装 */
const validate = function (event) {
	if (!event || !event.queryStringParameters || !event.queryStringParameters.page) {
		throw new Error('[queryStringParameter:page:notFound] Validatation Error');
	}

	if (!event || !event.queryStringParameters || !event.queryStringParameters.size) {
		throw new Error('[queryStringParameter:size:notFound] Validatation Error');
	}

	if (!Number.isInteger(event.queryStringParameters.page - 0)) {
		throw new Error('[queryStringParameter:page:notInteger] Validatation Error');
	}

	if (!Number.isInteger(event.queryStringParameters.size - 0)) {
		throw new Error('[queryStringParameter:size:notInteger] Validatation Error');
	}

	return {
		size: event.queryStringParameters.size,
		page: event.queryStringParameters.page,
	}
}

exports.handler = async function (event, context) {
  console.log('connecting...');
  try {
		client.connect();
	} catch (e) {
		console.log(e);
		const body = {
			errorMessage: 'DB Connection Error' 
		};
		const response = new Response(400, false, body, {});
		return response;
	}
  
	try {
		const params = validate(event);
		const limit = params.size;
		const offset = params.size * (params.page - 1);
		const query = `SELECT * FROM ${TABLE_NAME} limit ${limit} offset ${offset}`;
		const body = await new Promise((resolve, reject) => {
			client.query(query, (err, res) => {
				if (err) {
					reject(err);
				}
				if (!res) {
					reject(new Error(`No Response "${query}"`));
				}
				const result = {
					items: res.rows,
					size: res.rowCount,
					page: params.size
				}
				resolve(result);
			})
		});
		const response = new Response(200, false, body, {});
		return response;
	} catch (e) {
		console.log(e);
		const body = {
			errorMessage: 'DB Query Error' 
		};
		const response = new Response(400, false, body, {});
		return response;
	} finally {
		client.end();
	}
}