import { useEffect, useState } from 'react';
import { Block, listenToBlockchain, verifyChainIntegrity } from '@/integrations/firebase/blockchainService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, Clock, Database, Hash, Link as LinkIcon, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const BlockchainView = () => {
  const [chain, setChain] = useState<Block[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = listenToBlockchain((updatedChain) => {
      setChain(updatedChain);
      // Reset validation state if chain changes
      setIsValid(null);
    });
    return () => unsubscribe();
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate some delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 800));
    const result = await verifyChainIntegrity(chain);
    setIsValid(result);
    setIsVerifying(false);
    
    if (result) {
      toast.success('Blockchain integrity verified successfully!');
    } else {
      toast.error('Blockchain integrity compromise detected!', {
        description: 'One or more blocks have invalid hashes or broken links.'
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Blockchain Ledger
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Secure, immutable records of all elections</p>
        </div>
        <div className="flex items-center gap-3">
          {isValid !== null && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                isValid 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {isValid ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {isValid ? 'Chain Verified' : 'Chain Compromised'}
            </motion.div>
          )}
          <Button 
            onClick={handleVerify} 
            disabled={isVerifying || chain.length === 0}
            variant={isValid === true ? "outline" : "default"}
            className="group"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isVerifying ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            {isVerifying ? 'Verifying...' : 'Verify Chain Integrity'}
          </Button>
        </div>
      </div>

      {chain.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50 dark:bg-gray-900/20">
          <CardContent className="py-12 text-center">
            <Database className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-500">No blocks discovered yet on the chain.</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Blocks are created automatically when elections are finalized.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line connector */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500 opacity-20 hidden md:block" />
          
          <div className="space-y-12">
            <AnimatePresence mode="popLayout">
              {chain.map((block, index) => (
                <motion.div
                  key={block.hash}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex flex-col md:flex-row items-center gap-8 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Block Number Indicator */}
                  <div className="absolute left-6 md:left-1/2 -ml-3 w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 border-4 border-white dark:border-gray-950 z-10 shadow-lg shadow-blue-500/20" />

                  <Card className="w-full md:w-[calc(50%-2rem)] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-600">
                    <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-mono">
                          BLOCK #{block.index}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {new Date(block.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">{block.data.electionTitle}</CardTitle>
                      <CardDescription className="text-xs font-mono break-all truncate hover:text-clip">
                        ID: {block.data.electionId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Results Summary */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Final Results</p>
                        <div className="grid grid-cols-1 gap-2">
                          {block.data.results.map((result, rIdx) => (
                            <div key={rIdx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 px-3 py-2 rounded-md border border-gray-100 dark:border-gray-700/50">
                              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                {rIdx === 0 && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                {result.candidateName}
                              </span>
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {result.votes} votes
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hash Data */}
                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" /> Previous Hash
                          </p>
                          <p className={`text-[10px] font-mono break-all p-1.5 rounded bg-gray-50 dark:bg-gray-900/60 ${block.index === 0 ? 'text-gray-400 italic' : 'text-purple-600 dark:text-purple-400'}`}>
                            {block.previousHash}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                            <Hash className="w-3 h-3" /> Block Hash
                          </p>
                          <p className="text-[10px] font-mono break-all text-blue-600 dark:text-blue-400 p-1.5 rounded bg-blue-50/50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 shadow-inner">
                            {block.hash}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Spacer for reverse layout */}
                  <div className="hidden md:block w-[calc(50%-2rem)]" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainView;
