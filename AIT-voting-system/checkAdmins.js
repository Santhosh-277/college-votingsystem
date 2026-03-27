import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

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

async function checkAdmins() {
  const adminsRef = ref(database, 'admins');
  const snapshot = await get(adminsRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    console.log('Total Admins:', Object.keys(data).length);
    Object.values(data).forEach((admin) => {
      console.log(`- ${admin.name} (${admin.email})`);
    });
  } else {
    console.log('No admins found.');
  }
  process.exit(0);
}

checkAdmins();
