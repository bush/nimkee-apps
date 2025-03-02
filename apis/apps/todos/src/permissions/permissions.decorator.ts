// https://auth0.com/blog/developing-a-secure-api-with-nestjs-adding-role-based-access-control/#Implement-Role-Based-Access-Control-in-NestJS

import { SetMetadata } from '@nestjs/common';

export const Permissions = (...args: string[]) => SetMetadata('permissions', args);
