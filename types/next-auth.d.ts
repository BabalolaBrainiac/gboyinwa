import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    permissions: string[];
    displayName: string;
  }

  interface Session {
    user: User & { id: string; role: string; permissions: string[]; displayName: string };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    role: string;
    permissions: string[];
    displayName: string;
  }
}
