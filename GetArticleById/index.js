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
	if (!event || !event.pathParameters || !event.pathParameters.id) {
		throw new Error('[pathParameters:id:notFound] Validatation Error');
	}

	if (!Number.isInteger(event.pathParameters.id - 0)) {
		throw new Error('[pathParameters:id:notInteger] Validatation Error');
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
		validate(event);
	} catch (e) {
		console.log(e);
		const body = {
			errorMessage: e.message
		};
		const response = new Response(400, false, body, {});
		return response;
	}

	const params = {
		id: event.pathParameters.id,
	};
  
	try {
		const id = params.id;
		const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ${id}`;
		const body = await new Promise((resolve, reject) => {
			client.query(query, (err, res) => {
				if (err) {
					reject(err);
				}
				if (!res) {
					reject(new Error(`No Response "${query}"`));
				}
				const result = res.rows[0];
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
