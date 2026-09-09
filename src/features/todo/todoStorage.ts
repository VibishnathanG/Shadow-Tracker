import { StandaloneTodo } from './todoTypes';

const TODO_STORAGE_KEY = 'shadow_standalone_todos_v1';

export function getStoredTodos(): StandaloneTodo[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(TODO_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load standalone todos:', e);
    return [];
  }
}

export function saveStoredTodos(todos: StandaloneTodo[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.error('Failed to save standalone todos:', e);
  }
}

function generateNotificationId(todoId: string): number {
  let hash = 0;
  for (let i = 0; i < todoId.length; i++) {
    hash = (hash << 5) - hash + todoId.charCodeAt(i);
    hash |= 0;
  }
  return 900000 + (Math.abs(hash) % 90000);
}

export async function scheduleTodoNotification(todo: StandaloneTodo): Promise<number | undefined> {
  if (!todo.reminderTime) return undefined;

  const reminderDate = new Date(todo.reminderTime);
  if (isNaN(reminderDate.getTime()) || reminderDate.getTime() <= Date.now()) {
    return undefined;
  }

  const notificationId = generateNotificationId(todo.id);

  // 1. Try Capacitor LocalNotifications (Android / Mobile)
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] }).catch(() => {});
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: `📌 ToDo Reminder: ${todo.title}`,
            body: todo.description || `Priority: ${todo.priority.toUpperCase()} | Standalone ToDo Alarm`,
            schedule: { at: reminderDate },
            smallIcon: 'ic_stat_icon',
            iconColor: '#10B981',
            sound: 'default',
          },
        ],
      });
      return notificationId;
    }
  } catch {
    // Capacitor unavailable (Browser / Tauri Desktop)
  }

  // 2. Web Notification Fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const delay = reminderDate.getTime() - Date.now();
    if (delay > 0 && delay < 2147483647) {
      setTimeout(() => {
        try {
          new Notification(`📌 ToDo Reminder: ${todo.title}`, {
            body: todo.description || `Priority: ${todo.priority.toUpperCase()}`,
            icon: '/logo.svg',
          });
        } catch (e) {
          console.error('Web notification failed:', e);
        }
      }, delay);
    }
  }

  return notificationId;
}

export async function cancelTodoNotification(notificationId?: number): Promise<void> {
  if (!notificationId) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] }).catch(() => {});
  } catch {
    // Ignore error if Capacitor unavailable
  }
}
