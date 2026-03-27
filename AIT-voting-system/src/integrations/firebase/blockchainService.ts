import { database } from './config';
import { ref, set, get, push, onValue } from 'firebase/database';

export interface BlockData {
  electionId: string;
  electionTitle: string;
  results: {
    candidateName: string;
    votes: number;
  }[];
  timestamp: string;
}

export interface Block {
  index: number;
  timestamp: string;
  data: BlockData;
  previousHash: string;
  hash: string;
}

const BLOCKCHAIN_PATH = 'blockchain';

// Helper function to calculate SHA-256 hash
async function calculateHash(index: number, timestamp: string, data: BlockData, previousHash: string): Promise<string> {
  const message = `${index}${timestamp}${JSON.stringify(data)}${previousHash}`;
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Get the entire blockchain from Firebase
export const getBlockchain = async (): Promise<Block[]> => {
  try {
    const blockchainRef = ref(database, BLOCKCHAIN_PATH);
    const snapshot = await get(blockchainRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data) as Block[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching blockchain:', error);
    throw error;
  }
};

// Listen to real-time blockchain updates
export const listenToBlockchain = (callback: (blocks: Block[]) => void): (() => void) => {
  const blockchainRef = ref(database, BLOCKCHAIN_PATH);
  
  const unsubscribe = onValue(blockchainRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const blocks = Object.values(data) as Block[];
      // Sort by index to ensure correct order
      blocks.sort((a, b) => a.index - b.index);
      callback(blocks);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

// Add a new block to the chain
export const addBlockToChain = async (electionData: any): Promise<void> => {
  try {
    const chain = await getBlockchain();
    const previousBlock = chain.length > 0 ? chain[chain.length - 1] : null;
    
    const index = chain.length;
    const timestamp = new Date().toISOString();
    const previousHash = previousBlock ? previousBlock.hash : '0';
    
    const blockData: BlockData = {
      electionId: electionData.id,
      electionTitle: electionData.title,
      results: electionData.candidates.map((c: any) => ({
        candidateName: c.name,
        votes: c.votes
      })).sort((a: any, b: any) => b.votes - a.votes),
      timestamp: electionData.end_time || timestamp
    };
    
    const hash = await calculateHash(index, timestamp, blockData, previousHash);
    
    const newBlock: Block = {
      index,
      timestamp,
      data: blockData,
      previousHash,
      hash
    };
    
    const blockchainRef = ref(database, `${BLOCKCHAIN_PATH}/${index}`);
    await set(blockchainRef, newBlock);
    
    console.log(`Block #${index} added to the chain.`);
  } catch (error) {
    console.error('Error adding block to chain:', error);
    throw error;
  }
};

// Verify the integrity of the blockchain
export const verifyChainIntegrity = async (chain: Block[]): Promise<boolean> => {
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];
    
    // Recalculate hash of the current block
    const recalculatedHash = await calculateHash(
      currentBlock.index,
      currentBlock.timestamp,
      currentBlock.data,
      currentBlock.previousHash
    );
    
    if (currentBlock.hash !== recalculatedHash) {
      console.error(`Hash mismatch at index ${i}`);
      return false;
    }
    
    if (currentBlock.previousHash !== previousBlock.hash) {
      console.error(`Previous hash mismatch at index ${i}`);
      return false;
    }
  }
  return true;
};
