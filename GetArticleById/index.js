const { Client, Pool } = require('pg');
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
	if (!event || !event.pathParameters || !event.pathParameters.id) {
		throw new Error('[pathParameters:id:notFound] Validatation Error');
	}

	if (!Number.isInteger(event.pathParameters.id - 0)) {
		throw new Error('[pathParameters:id:notInteger] Validatation Error');
	}
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
		id: event.pathParameters.id,
	};
  
	try {
		const id = params.id;
		const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ${id}`;
		const result = await new Promise((resolve, reject) => {
			client.query(query, (err, res) => {
				if (err) {
					console.error(err);
					reject(err);
				}
				if (!res) {
					reject(new Error(`No Response "${query}"`));
				}
				console.log(res);
				const result = res.rows[0];
				resolve(result);
			})
		});

		let response;
		if (!result) {
			const body = new ErrorBody(`[id:${id}]NotFound Resource`, 4003);
			response = new Response(400, false, body, {});
			return response;
		}

		response = new Response(200, false, result, {});
		return response;
	} catch (e) {
		console.log(e);
		const body = new ErrorBody('DB Query Error', 4004);
		response = new Response(400, false, body, {});
		return response;
	}
}

client.connect();
