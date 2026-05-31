export const MOCK_ADMIN_USER = {
  id: 1,
  role: 'admin',
  fullName: 'Admin User',
  email: 'admin@srm.local',
};

export const MOCK_SUPPLIER_USER = {
  id: 2,
  role: 'supplier',
  fullName: 'Supplier User',
  email: 'supplier@srm.local',
  companyName: 'Apex Industrial Components',
};

export function getSessionUser(requiredRole) {
  const storedUser = sessionStorage.getItem('srm_user');
  let user = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }

  if (user?.role === requiredRole) {
    return user;
  }

  if (import.meta.env.DEV) {
    return requiredRole === 'admin' ? MOCK_ADMIN_USER : MOCK_SUPPLIER_USER;
  }

  return user?.role === requiredRole ? user : null;
}
