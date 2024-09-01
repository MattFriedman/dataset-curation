const { isAuthenticated, roleAccess } = require('../middleware/rbac');

describe('Authentication Middleware', () => {
  it('should call next() if user is authenticated', () => {
    const req = { isAuthenticated: jest.fn().mockReturnValue(true) };
    const res = {};
    const next = jest.fn();

    isAuthenticated(req, res, next);

    expect(req.isAuthenticated).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should redirect to login if user is not authenticated', () => {
    const req = { isAuthenticated: jest.fn().mockReturnValue(false) };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    isAuthenticated(req, res, next);

    expect(req.isAuthenticated).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Role Access Middleware', () => {
  it('should call next() if user has allowed role', () => {
    const req = {
      isAuthenticated: jest.fn().mockReturnValue(true),
      user: { roles: ['admin'] }
    };
    const res = {};
    const next = jest.fn();

    roleAccess(['admin'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should send 403 if user does not have allowed role', () => {
    const req = {
      isAuthenticated: jest.fn().mockReturnValue(true),
      user: { roles: ['user'] }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    const next = jest.fn();

    roleAccess(['admin'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Access Denied');
    expect(next).not.toHaveBeenCalled();
  });

  it('should send 403 if user is not authenticated', () => {
    const req = {
      isAuthenticated: jest.fn().mockReturnValue(false)
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    const next = jest.fn();

    roleAccess(['admin'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Access Denied');
    expect(next).not.toHaveBeenCalled();
  });
});
