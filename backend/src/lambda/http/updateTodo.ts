import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodoData: UpdateTodoRequest = JSON.parse(event.body)

    const userId = getUserId(event);
    const updatedTodo = await updateTodo(userId, todoId, updatedTodoData);

    return {
        statusCode: 200,
        body: JSON.stringify({
            item: updatedTodo
        })
    }}
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
