import crypto from 'crypto';

// Simulation of the hashing logic used in the browser
async function calculateHash(index, timestamp, data, previousHash) {
  const message = `${index}${timestamp}${JSON.stringify(data)}${previousHash}`;
  return crypto.createHash('sha256').update(message).digest('hex');
}

async function testBlockchain() {
  const b1_data = { electionId: '1', electionTitle: 'Test Election', results: [{ candidateName: 'A', votes: 10 }] };
  const b1_timestamp = '2026-03-20T10:00:00Z';
  const b1_prevHash = '0';
  const b1_hash = await calculateHash(0, b1_timestamp, b1_data, b1_prevHash);
  
  console.log('Block 0 Hash:', b1_hash);
  
  const b2_data = { electionId: '2', electionTitle: 'Test Election 2', results: [{ candidateName: 'B', votes: 20 }] };
  const b2_timestamp = '2026-03-20T11:00:00Z';
  const b2_prevHash = b1_hash;
  const b2_hash = await calculateHash(1, b2_timestamp, b2_data, b2_prevHash);
  
  console.log('Block 1 Hash:', b2_hash);
  
  // Verify integrity
  async function verify(b1, b2) {
    const recalc1 = await calculateHash(b1.index, b1.timestamp, b1.data, b1.previousHash);
    if (recalc1 !== b1.hash) return false;
    
    const recalc2 = await calculateHash(b2.index, b2.timestamp, b2.data, b2.previousHash);
    if (recalc2 !== b2.hash) return false;
    
    if (b2.previousHash !== b1.hash) return false;
    
    return true;
  }
  
  const chain = [
    { index: 0, timestamp: b1_timestamp, data: b1_data, previousHash: b1_prevHash, hash: b1_hash },
    { index: 1, timestamp: b2_timestamp, data: b2_data, previousHash: b2_prevHash, hash: b2_hash }
  ];
  
  const isValid = await verify(chain[0], chain[1]);
  console.log('Chain Integrity Valid:', isValid);
  
  if (isValid) {
    console.log('VERIFICATION SUCCESS');
  } else {
    console.log('VERIFICATION FAILED');
  }
}

testBlockchain();
