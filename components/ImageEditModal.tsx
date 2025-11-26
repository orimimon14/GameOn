import React, { useState } from 'react';

interface ImageEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string) => void;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrlInput(e.target.value);
        setPreviewUrl(e.target.value);
    }
    
    const handleSave = () => {
        if (previewUrl) {
            onSave(previewUrl);
        }
        resetState();
    };

    const handleClose = () => {
        onClose();
        resetState();
    };

    const resetState = () => {
        setPreviewUrl(null);
        setUrlInput('');
        setActiveTab('upload');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-md" onClick={handleClose}>
            <div className="bg-surface w-full max-w-md relative animate-fade-in-glitch border border-border-color" onClick={e => e.stopPropagation()}>
                <button onClick={handleClose} className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors z-10 text-2xl px-2">
                     <i className="fa-solid fa-times"></i>
                </button>
                
                <div className="p-8">
                    <h2 className="text-xl font-display text-text-primary mb-6 text-center uppercase">Update Datastream</h2>
                    
                    {/* Tabs */}
                    <div className="flex mb-4 bg-surface-secondary p-1 border border-border-color">
                        <button 
                            onClick={() => setActiveTab('upload')} 
                            className={`flex-1 py-2 font-display text-sm transition-colors ${activeTab === 'upload' ? 'bg-accent-cyan text-bg-cyber' : 'text-text-secondary hover:text-text-primary'}`}>
                            Upload
                        </button>
                        <button 
                            onClick={() => setActiveTab('url')}
                            className={`flex-1 py-2 font-display text-sm transition-colors ${activeTab === 'url' ? 'bg-accent-cyan text-bg-cyber' : 'text-text-secondary hover:text-text-primary'}`}>
                             From URL
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mb-4 min-h-[80px]">
                        {activeTab === 'upload' ? (
                            <div className="text-center p-4 border-2 border-dashed border-border-color">
                                <label htmlFor="file-upload" className="cursor-pointer bg-surface-secondary border border-border-color text-text-primary font-display py-2 px-4 transition hover:bg-border-color text-sm uppercase">
                                    Select File...
                                </label>
                                <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>
                        ) : (
                            <input 
                                type="text"
                                placeholder="https://..."
                                value={urlInput}
                                onChange={handleUrlInputChange}
                                className="w-full bg-surface-secondary text-text-primary p-3 focus:outline-none border border-border-color focus:border-accent-cyan transition-all font-mono"
                            />
                        )}
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                        <div className="mb-6 aspect-video bg-bg-cyber flex justify-center items-center border border-border-color overflow-hidden">
                            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                    )}

                    {/* Actions */}
                     <div className="flex gap-4 font-display">
                        <button onClick={handleSave} disabled={!previewUrl} className="w-full bg-accent-cyan text-bg-cyber font-bold py-3 px-4 transition hover:brightness-110 disabled:bg-surface-secondary disabled:text-text-secondary disabled:cursor-not-allowed active:scale-95 text-sm uppercase">
                           Save
                        </button>
                         <button onClick={handleClose} className="w-full bg-surface-secondary text-text-primary font-bold py-3 px-4 transition hover:bg-border-color active:scale-95 text-sm uppercase">
                           Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditModal;