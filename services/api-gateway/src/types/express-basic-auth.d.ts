declare module 'express-basic-auth' {
  import type { RequestHandler } from 'express';

  export interface BasicAuthOptions {
    users?: Record<string, string>;
    authorizeAsync?: boolean;
    authorizer?: (...args: any[]) => any;
    challenge?: boolean;
    realm?: string;
    unauthorizedResponse?: any;
  }

  export default function basicAuth(options?: BasicAuthOptions): RequestHandler;
}

