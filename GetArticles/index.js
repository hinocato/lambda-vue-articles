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

class ErrorBody {
	constructor(errorMessage, errorCode) {
		this.errorMessage = errorMessage;
		this.errorCode = errorCode;
	}
}

/* 簡単なバリデーションで実装 */
const validate = function (event) {
	if (!event || !event.queryStringParameters) {
		return; // 未指定を許可		
	}

	if (!event.queryStringParameters.page) {
		return; // 未指定を許可
	} else if (!Number.isInteger(event.queryStringParameters.page - 0)) {
		throw new Error('[queryStringParameter:page:notInteger] Validatation Error');
	}

	if (!event.queryStringParameters.size) {
		return; // 未指定を許可
	} else if (!Number.isInteger(event.queryStringParameters.size - 0)) {
		throw new Error('[queryStringParameter:size:notInteger] Validatation Error');
	}

	return;
}

exports.handler = async function (event, context) {

	try {
		validate(event);
	} catch (e) {
		console.error(e);
		const body = new ErrorBody('DB Validation Error', 4002);
		const response = new Response(400, false, body, {});
		return response;
	}

	const params = {
		size: event.queryStringParameters?.size || 10,
		page: event.queryStringParameters?.page || 1,
	};

	try {
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
					items: res.rows || [],
					size: res.rowCount,
					page: params.page
				}
				resolve(result);
			})
		});
		const response = new Response(200, false, body, {});
		return response;
	} catch (e) {
		console.error(e);
		const body = new ErrorBody('DB Query Error', 4004);
		const response = new Response(400, false, body, {});
		return response;
	}
}

console.log('connecting...');
client.connect();