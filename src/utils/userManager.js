import fs from 'fs/promises'
import { join } from 'path'

function generateRandomPassword() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

class UserManager {
  constructor() {
    this.filePath = join(process.cwd(), 'users.json')
    this.configFile = join(process.cwd(), 'config.json')
  }

  async initialize() {
    try {
      await fs.access(this.configFile)
    } catch {
      // Create initial config if it doesn't exist
      await fs.writeFile(this.configFile, JSON.stringify({
        priceRange: '25-50' // Default price range
      }, null, 2))
    }
    try {
      await fs.access(this.filePath)
      // File exists, but let's verify admin user exists
      const users = await this.getUsers()
      if (!users.some(u => u.username === 'admin')) {
        await this.createAdminUser()
      }
    } catch {
      // File doesn't exist, create it with admin user
      await this.createAdminUser()
    }
  }

  getDefaultPreferences() {
    return {
      likes: [],
      dislikes: []
    }
  }

  async getConfig() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      return { priceRange: '25-50' }
    }
  }

  async updateConfig(updates) {
    const config = await this.getConfig()
    const newConfig = { ...config, ...updates }
    await fs.writeFile(this.configFile, JSON.stringify(newConfig, null, 2))
    return newConfig
  }

  async createAdminUser() {
    const initialData = {
      users: [{
        id: 1,
        username: 'admin',
        clearPassword: 'admin123', // Store clear password for admin too
        isAdmin: true,
        ready: false,
        likes: [],
        dislikes: [],
        matchedWith: null,
        giftPreferences: this.getDefaultPreferences()
      }]
    };
    await fs.writeFile(this.filePath, JSON.stringify(initialData, null, 2));
  }

  async getUsers() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8')
      return JSON.parse(data).users
    } catch {
      return []
    }
  }

  async saveUsers(users) {
    await fs.writeFile(this.filePath, JSON.stringify({ users }, null, 2))
  }

  async validateUser(username, password) {
    const users = await this.getUsers();
    const user = users.find(u => u.username === username);
    if (!user) return null;
    
    // Simple string comparison instead of bcrypt
    return user.clearPassword === password ? user : null;
  }

  async getNextId() {
    const users = await this.getUsers();
    if (users.length === 0) return 1;
    return Math.max(...users.map(user => user.id)) + 1;
  }

  async addUser(username, email, isAdmin = false) {
    const password = generateRandomPassword();
    
    const newUser = {
      id: await this.getNextId(),
      username,
      email,
      clearPassword: password, // Only store the clear password
      isAdmin,
      ready: false,
      matchedWith: null,
      giftPreferences: this.getDefaultPreferences()
    };
    
    const users = await this.getUsers();
    users.push(newUser);
    await this.saveUsers(users);
    return newUser;
  }

  async updateUser(id, updates) {
    const users = await this.getUsers()
    const index = users.findIndex(u => u.id === id)
    if (index === -1) throw new Error('User not found')

    users[index] = { ...users[index], ...updates }
    await this.saveUsers(users)
    return users[index]
  }

  async deleteUser(id) {
    const users = await this.getUsers()
    const filteredUsers = users.filter(u => u.id !== id)
    await this.saveUsers(filteredUsers)
  }

  async resetMatches() {
    console.log('🔄 Starting match reset...')
    const users = await this.getUsers()
    
    // Only reset matchedWith, preserve everything else including ready status
    const updatedUsers = users.map(user => ({
      ...user,
      matchedWith: null  // Only reset this field
    }))
    
    await this.saveUsers(updatedUsers)
    console.log('🔄 Matches reset complete - all other user data preserved')
    return updatedUsers
  }

  async validateAutoLoginToken(token) {
    try {
      // Decode the URL-safe base64 token
      const decoded = Buffer.from(token, 'base64').toString();
      console.log('Decoded token:', decoded);  // Debug log
      
      const [username, password] = decoded.split(':');
      console.log('Extracted credentials:', { username, password });  // Debug log
      
      const users = await this.getUsers();
      const user = users.find(u => 
        u.username === username && 
        u.clearPassword === password
      );
      
      console.log('Found user:', user ? 'Yes' : 'No');  // Debug log
      return user;
    } catch (error) {
      console.error('Token validation error:', error);  // Debug log
      return null;
    }
  }

  generateAutoLoginToken(username, password) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    console.log('Generated token:', token);  // Debug log
    return token;
  }
}

export const userManager = new UserManager()