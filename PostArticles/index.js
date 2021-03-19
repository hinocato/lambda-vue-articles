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
    const body = event.body;
    if (!body || !body.title) {
		throw new Error('[body:title:notNull] Validatation Error');
	}

    if (!body.text) {
		throw new Error('[body:text:notNull] Validatation Error');
	}
	return;
}

exports.handler = async function (event, context) {
	try {
		// event.body = JSON.parse(event.body || {});
		validate(event);
	} catch (e) {
		console.error(e);
		const body = new ErrorBody('DB Validation Error', 4002);
		const response = new Response(400, false, body, {"Access-Control-Allow-Origin": "*"});
		return response;
	}

	const params = {
		title: event.body.title,
		text: event.body.text,
		thumbnailUrl: event.body.thumbnailUrl,
	};

	try {
		const queryString = `INSERT INTO ${TABLE_NAME} (title, text, thumbnail_url)  VALUES ($1, $2, $3) RETURNING *`;
		const values = [params.title, params.text, params.thumbnail_url];
		const body = await new Promise((resolve, reject) => {
			client.query(queryString, values, (err, res) => {
				if (err) {
					reject(err);
				}
                if (!res.rows[0]) {
                    reject(res)
                }
				resolve(res.rows[0]);
			})
		});
		const response = new Response(200, false, body, {"Access-Control-Allow-Origin": "*"});
		return response;
	} catch (e) {
		console.error(e);
		const body = new ErrorBody('DB Query Error', 4004);
		const response = new Response(400, false, body, {"Access-Control-Allow-Origin": "*"});
		return response;
	}
}

console.log('connecting...');
client.connect();