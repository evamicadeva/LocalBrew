import { getCurrentUser } from './api.js';

export async function requireRole(expectedRole) {
  const user = await getCurrentUser();

  if (!user) {
    window.location.replace('login.html');
    return null;
  }

  if (user.role !== expectedRole) {
    window.location.replace('../index.html');
    return null;
  }

  return user;
}