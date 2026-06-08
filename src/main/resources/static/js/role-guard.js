import { getCurrentUser } from './api.js';

export async function requireAnyRole(expectedRoles) {
  const roles = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
  const user = await getCurrentUser();

  if (!user) {
    window.location.replace('login.html');
    return null;
  }

  if (!roles.includes(user.role)) {
    window.location.replace('../index.html');
    return null;
  }

  return user;
}

