const AWS = require('aws-sdk');
const dynamoDBClient = new AWS.DynamoDB.DocumentClient({
   region: "ap-northeast-1" 
});

exports.handler = async (event, context) => {
    const id = event.pathParameters.id - 0;
    const params = {
        TableName: 'vue-articles',
        Key: { 
            id,
        }
    };

    const response = {
        statusCode: 200,
        isBase64Encoded: false,
        body: JSON.stringify(await dynamoDBClient.get(params).promise()),
        headers: {},
    };
    
    return response;
};
