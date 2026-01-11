import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Collaborator } from '../types';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  currentPlanId?: string;
}

const CollaborationModal: React.FC<CollaborationModalProps> = ({ isOpen, onClose, currentUserEmail, currentPlanId }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Public Access State
  const [isPublic, setIsPublic] = useState(false);
  const [publicLinkId, setPublicLinkId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
      loadPublicStatus();
    }
  }, [isOpen]);

  const loadPublicStatus = async () => {
    if (!currentPlanId) return;

    const { data, error } = await supabase
      .from('war_map_data')
      .select('is_public, public_link_id')
      .eq('id', currentPlanId)
      .single();

    if (data) {
      setIsPublic(data.is_public || false);
      setPublicLinkId(data.public_link_id);
    }
  };

  const togglePublicAccess = async () => {
    if (!currentPlanId) return;
    
    const newStatus = !isPublic;
    // Optimistic update
    setIsPublic(newStatus); 

    const { error } = await supabase
      .from('war_map_data')
      .update({ is_public: newStatus })
      .eq('id', currentPlanId);

    if (error) {
      console.error('Error updating public status:', error);
      setIsPublic(!newStatus); // Revert
      setError('Failed to update public status');
    } else {
        // If we just enabled it and didn't have an ID, reload to get it (though it should be default generated)
        if (newStatus && !publicLinkId) loadPublicStatus();
    }
  };

  const loadCollaborators = async () => {
    if (!currentPlanId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('plan_collaborators')
      .select('*')
      .eq('plan_id', currentPlanId);

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
          plan_id: currentPlanId,
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

          {/* Public Access Section */}
          <div className="mb-8 p-4 bg-gray-50 border border-gray-100 rounded">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-800">Public Access</h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  Anyone with the link can view (read-only).
                </p>
              </div>
              <button 
                onClick={togglePublicAccess}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isPublic ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {isPublic && publicLinkId && (
              <div className="mt-3 flex items-center gap-2">
                <input 
                  readOnly 
                  value={`${window.location.origin}/?p=${publicLinkId}`} 
                  className="flex-1 text-[10px] bg-white border border-gray-200 p-2 rounded text-gray-600 focus:outline-none select-all"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?p=${publicLinkId}`)}
                  className="p-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                  title="Copy URL"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>
            )}
          </div>

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
