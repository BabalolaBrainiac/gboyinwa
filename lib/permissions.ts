export type Permission =
  | 'posts:create'
  | 'posts:edit'
  | 'posts:delete'
  | 'posts:publish'
  | 'events:create'
  | 'events:edit'
  | 'events:delete'
  | 'users:manage'
  | 'permissions:manage';

export const ALL_PERMISSIONS: Permission[] = [
  'posts:create',
  'posts:edit',
  'posts:delete',
  'posts:publish',
  'events:create',
  'events:edit',
  'events:delete',
  'users:manage',
  'permissions:manage',
];
