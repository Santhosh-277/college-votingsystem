import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// Firebase configuration from config.ts
const firebaseConfig = {
  apiKey: "AIzaSyDHeHHsFBU3WyHfOEVJAMlblM_2LTTp0Ps",
  authDomain: "college-vote-hub.firebaseapp.com",
  projectId: "college-vote-hub",
  storageBucket: "college-vote-hub.firebasestorage.app",
  messagingSenderId: "1010432861476",
  appId: "1:1010432861476:web:7000e7187826967a54ffb1",
  measurementId: "G-RY4N11HY69",
  databaseURL: "https://college-vote-hub-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const admins = [
  { name: 'Nivya', email: 'nivya@votehub.com', password: 'NivyaPass@2026' },
  { name: 'Santhosh', email: 'santhosh@votehub.com', password: 'SanthoshPass@2026' },
  { name: 'Sanjay', email: 'sanjay@votehub.com', password: 'SanjayPass@2026' },
  { name: 'Dhilip', email: 'dhilip@votehub.com', password: 'DhilipPass@2026' }
];

async function setupAdmins() {
  console.log('--- Starting Admin Account Setup ---');
  
  for (const admin of admins) {
    try {
      const sanitizedEmail = admin.email.replace(/[.#$\[\]]/g, '_');
      const adminId = `admin_${sanitizedEmail}_${Date.now()}`;
      
      const adminData = {
        id: adminId,
        email: admin.email,
        name: admin.name,
        createdAt: new Date().toISOString(),
        role: 'admin',
        password: Buffer.from(admin.password).toString('base64') // Match btoa() logic
      };

      const adminRef = ref(database, `admins/${adminId}`);
      await set(adminRef, adminData);
      
      console.log(`✅ ${admin.name} registered: ${admin.email} / ${admin.password}`);
    } catch (error) {
      console.error(`❌ Failed to register ${admin.name}:`, error.message);
    }
  }
  
  console.log('--- Admin Account Setup Completed ---');
  process.exit(0);
}

setupAdmins();
