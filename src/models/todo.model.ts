export class Todo {
    id: number = 0;
    todo: string = "";
    completed: boolean = false;
    userId: number = 0;
}
export class TodoGetRes {
    todos: Array<Todo> = []
}