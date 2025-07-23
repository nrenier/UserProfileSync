import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import * as connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Initialize admin user if not exists
export async function initializeAdmin() {
  try {
    const adminExists = await storage.getUserByUsername('admin');
    if (!adminExists) {
      const adminUser = await storage.createUser({
        username: 'admin',
        email: 'admin@company.com',
        password: await hashPassword('admin123'),
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
      });
      console.log('Admin user created successfully:', { username: adminUser.username, role: adminUser.role });
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg.default(session);
  const sessionStore = new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: true,
    tableName: 'sessions'
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-development-very-long-string',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    rolling: true,
    cookie: {
      secure: false, // Disable for development
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    },
    name: 'local.session'
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id.toString());
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user ID:', id, 'Type:', typeof id);
      
      const userId = parseInt(id);
      if (isNaN(userId)) {
        console.log('Invalid user ID format:', id);
        return done(null, false);
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('User not found for ID:', userId);
        return done(null, false);
      }
      
      console.log('Successfully deserialized user:', user.username);
      done(null, user);
    } catch (error) {
      console.error('Error in deserializeUser:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
        role: 'user',
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role 
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('=== POST /api/login DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Session ID before auth:', req.sessionID);
    console.log('============================');
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.log('❌ Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('❌ Invalid credentials');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log('✅ User authenticated:', user.username);
      req.login(user, (err: any) => {
        if (err) {
          console.log('❌ Login error:', err);
          return next(err);
        }
        
        console.log('✅ Login successful, session ID:', req.sessionID);
        console.log('Session after login:', JSON.stringify(req.session, null, 2));
        
        const response = { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role 
        };
        
        console.log('✅ Sending response:', response);
        res.status(200).json(response);
      });
    })(req, res, next);
  });

  // Handle GET requests to /api/login (browser navigation)
  app.get("/api/login", (req, res) => {
    console.log('⚠️  GET /api/login - Browser navigated to API endpoint');
    console.log('Redirecting to /auth page');
    res.redirect('/auth');
  });

  app.post("/api/logout", (req, res, next) => {
    console.log('=== POST /api/logout ===');
    console.log('Session before logout:', req.sessionID);
    
    req.logout((err) => {
      if (err) {
        console.log('❌ Logout error:', err);
        return next(err);
      }
      console.log('✅ Logout successful');
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('=== GET /api/user DEBUG ===');
    console.log('Request origin:', req.headers.origin);
    console.log('Request referer:', req.headers.referer);
    console.log('Session ID:', req.sessionID);
    console.log('Session object:', JSON.stringify(req.session, null, 2));
    console.log('isAuthenticated():', req.isAuthenticated());
    console.log('req.user:', req.user);
    console.log('Cookie header:', req.headers.cookie);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('=========================');
    
    if (!req.isAuthenticated() || !req.user) {
      console.log('❌ User not authenticated, returning 401');
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as SelectUser;
      const userResponse = { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role 
      };
      
      console.log('✅ Returning user data:', userResponse);
      res.json(userResponse);
    } catch (error) {
      console.error('❌ Error in /api/user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
export function isAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}