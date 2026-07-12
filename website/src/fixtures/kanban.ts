import { Entity, resource } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

type TaskData = {
  id: string;
  title: string;
  status: string;
};

type KanbanInterceptorState = {
  tasks: Record<string, TaskData>;
};

export class Task extends Entity {
  id = '';
  title = '';
  status = 'backlog';
  pk() {
    return this.id;
  }

  static key = 'Task';
}
export const TaskResource = resource({
  path: '/tasks/:id',
  searchParams: {} as { status: string },
  schema: Task,
  optimistic: true,
});

const initialTasks = {
  '1': { id: '1', title: 'Design schema', status: 'backlog' },
  '2': { id: '2', title: 'Write docs', status: 'backlog' },
  '3': { id: '3', title: 'Build endpoints', status: 'in-progress' },
  '4': { id: '4', title: 'Review PR', status: 'in-progress' },
};

export const getInitialInterceptorData = (): KanbanInterceptorState => ({
  tasks: JSON.parse(JSON.stringify(initialTasks)),
});

export const kanbanFixtures: Interceptor<KanbanInterceptorState>[] = [
  {
    endpoint: TaskResource.getList.move,
    response(
      { id }: Parameters<typeof TaskResource.getList.move>[0],
      body: Parameters<typeof TaskResource.getList.move>[1],
    ) {
      if (this.tasks[id]) {
        this.tasks[id] = { ...this.tasks[id], ...body };
      }
      return this.tasks[id] || { id, ...body };
    },
    delay: 500,
  },
  {
    endpoint: TaskResource.getList,
    response({ status }: Parameters<typeof TaskResource.getList>[0]) {
      return Object.values(this.tasks).filter(t => t.status === status);
    },
    delay: 150,
  },
];
