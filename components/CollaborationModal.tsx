import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Collaborator } from '../types';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

const CollaborationModal: React.FC<CollaborationModalProps> = ({ isOpen, onClose, currentUserEmail }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
    }
  }, [isOpen]);

  const loadCollaborators = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('plan_collaborators')
      .select('*')
      .eq('owner_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) {
      console.error('Error loading collaborators:', error);
    } else {
      setCollaborators(data || []);
    }
    setIsLoading(false);
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !currentUserEmail) return;
    setError(null);
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('plan_collaborators')
        .insert({
          owner_id: user.id,
          owner_email: currentUserEmail,
          collaborator_email: newEmail.trim().toLowerCase(),
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
            setError('This user is already a collaborator.');
        } else {
            throw error;
        }
      } else {
        setNewEmail('');
        loadCollaborators();
      }
    } catch (err: any) {
      console.error('Error adding collaborator:', err);
      setError(err.message || 'Failed to add collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;
    
    const { error } = await supabase
      .from('plan_collaborators')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator');
    } else {
      loadCollaborators();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-black uppercase tracking-wide text-sm">Share Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-xs text-gray-500 mb-4">
            Invite others to view and edit your Yearly War Map. They will need to sign in with the email address you provide.
          </p>

          <form onSubmit={handleAddCollaborator} className="flex gap-2 mb-6">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 text-sm border-gray-300 rounded focus:ring-black focus:border-black"
              required
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50"
            >
              {isLoading ? '...' : 'Invite'}
            </button>
          </form>
          
          {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Collaborators</h3>
            {collaborators.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No collaborators yet.</p>
            ) : (
              <ul className="space-y-2">
                {collaborators.map(c => (
                  <li key={c.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                    <span className="text-sm font-medium">{c.collaborator_email}</span>
                    <button 
                      onClick={() => handleRemoveCollaborator(c.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove access"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationModal;
