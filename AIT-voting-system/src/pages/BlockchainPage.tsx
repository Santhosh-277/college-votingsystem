import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Database, ExternalLink } from 'lucide-react';
import BlockchainView from '@/components/BlockchainView';

const BlockchainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()} 
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-blue-600/10 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800">
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Election Transparency <span className="text-blue-600 dark:text-blue-400">Blockchain</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            Every finalized election is cryptographically hashed and linked to the previous record, 
            creating an immutable audit trail that anyone can verify.
          </p>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-gray-200 dark:border-gray-700 shadow-sm">
          <BlockchainView />
        </div>
        
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center gap-1.5 hover:text-blue-600 transition-colors cursor-help group">
            <ShieldCheck className="w-4 h-4" /> 
            Powered by SHA-256 Hashing Algorithm
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>
      </div>
    </div>
  );
};

// Internal icon for the footer
const ShieldCheck = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default BlockchainPage;
