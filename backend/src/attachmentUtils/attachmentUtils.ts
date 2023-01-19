import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { TodosAccess } from '../dataLayer/todosAccess'
import {createLogger} from "../utils/logger";

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('AttachmentUtils')
const todoAccess = new TodosAccess();


export class AttachmentUtils {
    constructor(
        private readonly s3Bucket: string = process.env.ATTACHMENT_S3_BUCKET,
        private readonly s3: AWS.S3 = new XAWS.S3({signatureVersion: 'v4'}),
        private readonly signedUrlExpiration: number = Number(process.env.SIGNED_URL_EXPIRATION)
    ) {}

    async createAttachmentPresignedUrl(userId: string, todoId: string): Promise<string> {
        logger.info('Creating attachment presigned url');

        await todoAccess.updateTodoWithAttachment(userId, todoId, this.s3Bucket);

        return this.s3.getSignedUrl('putObject', {
            Bucket: this.s3Bucket,
            Key: todoId,
            Expires: this.signedUrlExpiration
        });
    }
}
