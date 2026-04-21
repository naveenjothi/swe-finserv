import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Role } from '../../constants/roles.enum';

type RequestUser = {
  id: string;
  role: Role;
  name: string;
};

type RequestWithUser = Request & { user?: RequestUser };

const ROLE_SET = new Set<Role>(Object.values(Role));

function parseRole(raw?: string): Role | undefined {
  if (!raw) return undefined;
  const normalized = raw.trim().toUpperCase() as Role;
  return ROLE_SET.has(normalized) ? normalized : undefined;
}

@Injectable()
export class MockAuthMiddleware implements NestMiddleware {
  use(req: RequestWithUser, _res: Response, next: NextFunction): void {
    const authHeader = req.header('authorization');
    const bearerRole = authHeader?.startsWith('Bearer ')
      ? parseRole(authHeader.slice('Bearer '.length))
      : undefined;
    const headerRole = parseRole(req.header('x-user-role'));
    const role = bearerRole ?? headerRole ?? Role.RM;

    req.user = {
      id: req.header('x-user-id') ?? `dev-${role.toLowerCase()}`,
      role,
      name: req.header('x-user-name') ?? `${role.toLowerCase()}@sentinel.local`,
    };

    next();
  }
}
