/**
 * AUTH TEMPLATE SYSTEM
 *
 * Reusable authentication template for all VibeBaba projects
 * Provides complete auth flow: registration, login, JWT, password reset
 *
 * ARCHITECTURE:
 * - PocketBase: User collection + auth records
 * - Express: Auth endpoints (/api/auth/*)
 * - Next.js: Frontend pages (/login, /register, /forgot-password)
 * - JWT: Token-based authentication with refresh tokens
 */

import type { FileToValidate } from '../langgraph/validation/post-gen/types';

/**
 * PocketBase User Collection Schema
 */
export const userCollectionSchema = {
  name: 'users',
  type: 'auth', // PocketBase auth collection
  schema: [
    {
      name: 'username',
      type: 'text',
      required: true,
      options: {
        min: 3,
        max: 150,
        pattern: '^[a-zA-Z0-9_]+$',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      options: {
        exceptDomains: [],
        onlyDomains: [],
      },
    },
    {
      name: 'emailVisibility',
      type: 'bool',
      required: false,
    },
    {
      name: 'verified',
      type: 'bool',
      required: false,
    },
    {
      name: 'name',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: '',
      },
    },
    {
      name: 'avatar',
      type: 'file',
      required: false,
      options: {
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'],
        thumbs: ['100x100'],
      },
    },
    {
      name: 'role',
      type: 'select',
      required: false,
      options: {
        maxSelect: 1,
        values: ['user', 'admin'],
      },
    },
  ],
  indexes: [
    'CREATE UNIQUE INDEX idx_username ON users (username)',
    'CREATE UNIQUE INDEX idx_email ON users (email)',
  ],
};

/**
 * Express Auth Routes Template
 */
export const authRoutesTemplate = `
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import PocketBase from 'pocketbase';

const router = express.Router();
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('name').optional().isString()
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, username, name } = req.body;

      // Create user in PocketBase
      const user = await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        username,
        name: name || username,
        emailVisibility: true,
        verified: false,
        role: 'user'
      });

      // Send verification email (optional)
      try {
        await pb.collection('users').requestVerification(email);
      } catch (verifyError) {
        console.error('Failed to send verification email:', verifyError);
        // Continue anyway - user is created
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          verified: user.verified
        },
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle PocketBase validation errors
      if (error?.status === 400) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.data?.data || error.message
        });
      }

      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email/username and password
 */
router.post(
  '/login',
  [
    body('email').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Authenticate with PocketBase
      const authData = await pb.collection('users').authWithPassword(email, password);

      if (!authData.record) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = authData.record;

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          verified: user.verified,
          avatar: user.avatar
        },
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      console.error('Login error:', error);

      if (error?.status === 400) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded: any = jwt.verify(refreshToken, JWT_SECRET);

    // Get user from PocketBase
    const user = await pb.collection('users').getOne(decoded.userId);

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client should delete tokens)
 */
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // Optionally: implement token blacklist for added security
  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Request password reset from PocketBase
      await pb.collection('users').requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.json({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      console.error('Password reset request error:', error);
      // Still return success to prevent email enumeration
      res.json({ message: 'If the email exists, a password reset link has been sent' });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('passwordConfirm').notEmpty().withMessage('Password confirmation is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password, passwordConfirm } = req.body;

      if (password !== passwordConfirm) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      // Confirm password reset with PocketBase
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);

      res.json({ message: 'Password reset successful' });
    } catch (error: any) {
      console.error('Password reset error:', error);

      if (error?.status === 400) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      res.status(500).json({ error: 'Password reset failed' });
    }
  }
);

/**
 * GET /api/auth/verify-email
 * Verify email with token
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Confirm email verification with PocketBase
    await pb.collection('users').confirmVerification(token);

    res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Email verification error:', error);

    if (error?.status === 400) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.status(500).json({ error: 'Email verification failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Get user from PocketBase
    const user = await pb.collection('users').getOne(decoded.userId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        verified: user.verified,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
`;

/**
 * Express Auth Middleware Template
 */
export const authMiddlewareTemplate = `
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      username: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      username: string;
    };

    req.user = decoded;
  } catch (error) {
    // Invalid token - continue without user
  }

  next();
}
`;

/**
 * Frontend Login Page Template
 */
export const loginPageTemplate = `
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/auth/login\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email or Username
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 text-center">
          <span className="text-gray-600">Don't have an account? </span>
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
`;

/**
 * Frontend Register Page Template
 */
export const registerPageTemplate = `
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/auth/register\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Full Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="passwordConfirm" className="block text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
`;

/**
 * Frontend API Client Template (with auth)
 */
export const apiClientTemplate = `
/**
 * API Client with Authentication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class APIClient {
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(\`\${API_URL}/api/auth/refresh\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    let accessToken = this.getAccessToken();

    const makeRequest = async (token: string | null) => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = \`Bearer \${token}\`;
      }

      const response = await fetch(\`\${API_URL}\${endpoint}\`, {
        ...options,
        headers,
      });

      return response;
    };

    // First attempt
    let response = await makeRequest(accessToken);

    // If 401, try refreshing token
    if (response.status === 401) {
      const newToken = await this.refreshAccessToken();

      if (newToken) {
        // Retry with new token
        response = await makeRequest(newToken);
      } else {
        // Refresh failed - logout
        this.logout();
        throw new Error('Authentication failed');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): any {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const apiClient = new APIClient();
`;

/**
 * Environment Variables Template
 */
export const envTemplate = `
# Backend (Express) Environment Variables
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
POCKETBASE_URL=http://127.0.0.1:8090

# Frontend (Next.js) Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:5000
`;

/**
 * Package.json Dependencies
 */
export const authDependencies = {
  backend: {
    bcryptjs: '^2.4.3',
    jsonwebtoken: '^9.0.2',
    'express-validator': '^7.0.1',
    pocketbase: '^0.21.3',
  },
  backendDevDependencies: {
    '@types/bcryptjs': '^2.4.6',
    '@types/jsonwebtoken': '^9.0.5',
  },
  frontend: {},
};

/**
 * Generate complete auth system files
 */
export function generateAuthFiles(projectId: string): FileToValidate[] {
  const files: FileToValidate[] = [];

  // Backend: Auth routes
  files.push({
    path: 'backend/routes/auth.ts',
    content: authRoutesTemplate,
  });

  // Backend: Auth middleware
  files.push({
    path: 'backend/middleware/auth.ts',
    content: authMiddlewareTemplate,
  });

  // Frontend: Login page
  files.push({
    path: 'src/app/login/page.tsx',
    content: loginPageTemplate,
  });

  // Frontend: Register page
  files.push({
    path: 'src/app/register/page.tsx',
    content: registerPageTemplate,
  });

  // Frontend: API client
  files.push({
    path: 'src/lib/api-client.ts',
    content: apiClientTemplate,
  });

  // Environment variables
  files.push({
    path: '.env.local',
    content: envTemplate,
  });

  return files;
}

/**
 * Get PocketBase initialization script
 */
export function getPocketBaseInitScript(): string {
  return `
// Initialize PocketBase with users collection
const pb = new PocketBase('http://127.0.0.1:8090');

// Create users collection (run once)
await pb.collections.create(${JSON.stringify(userCollectionSchema, null, 2)});

console.log('PocketBase users collection created successfully');
`;
}

/**
 * Get Express server integration code
 */
export function getExpressServerIntegration(): string {
  return `
// In your main Express server file (e.g., server.ts)
import authRoutes from './routes/auth';

// Mount auth routes
app.use('/api/auth', authRoutes);

// Example of protected route using auth middleware
import { authenticateToken } from './middleware/auth';

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is protected', user: req.user });
});
`;
}

export default {
  userCollectionSchema,
  authRoutesTemplate,
  authMiddlewareTemplate,
  loginPageTemplate,
  registerPageTemplate,
  apiClientTemplate,
  envTemplate,
  authDependencies,
  generateAuthFiles,
  getPocketBaseInitScript,
  getExpressServerIntegration,
};
