import { TodosAccess } from './todosAccess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import {v4 as uuidv4} from 'uuid'

const todoAccess = new TodosAccess();
const attachmentUtils = new AttachmentUtils();

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    return todoAccess.getUserTodos(userId);
}

export async function createTodo(userId: string, todo: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuidv4();
    const done = false;
    const createdAt = new Date().toISOString();

    return todoAccess.createTodo({
        userId,
        todoId,
        done,
        createdAt,
        ...todo
    });
}

export async function updateTodo(userId: string, todoId: string, todoUpdate: UpdateTodoRequest): Promise<TodoItem> {
    return todoAccess.updateTodo(userId, todoId, todoUpdate);
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
    return todoAccess.deleteTodo(userId, todoId)
}

export async function createAttachmentPresignedUrl(userId: string, todoId: string) {
    const signedUrl = await attachmentUtils.createAttachmentPresignedUrl(todoId);
    await todoAccess.updateTodoWithAttachment(userId, todoId);

    return signedUrl;
}
