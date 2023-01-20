import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable: string = process.env.TODOS_TABLE,
        private readonly s3Bucket: string = process.env.ATTACHMENT_S3_BUCKET,
    ) {}

    async getUserTodos(userId: string): Promise<TodoItem[]> {
        logger.info('Getting todos');
        const results = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        return results.Items as TodoItem[];
    }

    async createTodo (newTodo: TodoItem): Promise<TodoItem> {
        logger.info('Creating todo');

        await this.docClient.put({
            TableName: this.todosTable,
            Item: newTodo
        }).promise();

        return newTodo;
    }

    async updateTodo (userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<TodoItem> {
        logger.info('Updating todo');

        const result = await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                userId,
                todoId
            },
            UpdateExpression: "set #name = :name, #dueDate = :dueDate, #done = :done",
            ExpressionAttributeNames: {
                "#name": "name",
                "#dueDate": "dueDate",
                "#done": "done",
            },
            ExpressionAttributeValues: {
                ":name": todoUpdate.name,
                ":dueDate": todoUpdate.dueDate,
                ":done": todoUpdate.done,
            },
            ReturnValues: "ALL_NEW"
        }).promise();

        return result.Attributes as TodoItem;
    }

    async deleteTodo (userId: string, todoId: string): Promise<void> {
        logger.info('Deleting todo');

        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                userId,
                todoId
            }
        }).promise();
    }

    async updateTodoWithAttachment(userId: string, todoId: string): Promise<void> {
        logger.info(`Updating todo ${todoId} with attachment`);

        const attachmentUrl: string = `https://${this.s3Bucket}.s3.amazonaws.com/${todoId}`

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "set #attachmentUrl = :attachmentUrl",
            ExpressionAttributeNames: {
                "#attachmentUrl": "attachmentUrl"
            },
            ExpressionAttributeValues: {
                ":attachmentUrl": attachmentUrl
            }
        }).promise()
    }
}

