import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Image as ImageIcon, Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export interface PostDocument {
  text: string;
  imageUrl: string;
  createdAt: any; // Firebase serverTimestamp
}

export const CreatePostDemo: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Status states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection and local preview generation
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Basic type validation (images only)
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, etc.)');
        return;
      }

      // Basic size validation (approx 5MB limit for safety)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Selected image is too large. Max size is 5MB.');
        return;
      }

      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  // Submit Handler: Core Firebase Post Creation Logic
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!text.trim() && !file) {
      setError('Please provide text or select an image to post');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);

    try {
      let downloadUrl = '';

      // STEP 1: Upload Image to Firebase Storage if a file was selected
      if (file) {
        // Create a unique filepath prefixing with a timestamp for collision avoidance
        const storagePath = `posts/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        // Use uploadBytesResumable to track real progress updates
        const uploadTask = uploadBytesResumable(storageRef, file);

        downloadUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Calculate progress percentage
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (err) => {
              // Firebase Storage specific error handling
              console.error('Storage Upload Error:', err);
              reject(new Error(`Failed to upload image: ${err.message}`));
            },
            async () => {
              // STEP 2: Retrieve the final secure download URL once complete
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (urlErr: any) {
                reject(new Error(`Failed to retrieve download URL: ${urlErr.message}`));
              }
            }
          );
        });
      }

      // STEP 3: Save metadata & image URL together in a single Firestore document
      const postsCollection = collection(db, 'posts');
      const postPayload: PostDocument = {
        text: text.trim(),
        imageUrl: downloadUrl,
        createdAt: serverTimestamp() // Uses Firebase server's precise timestamp
      };

      await addDoc(postsCollection, postPayload);

      // Clean up input states on success
      setText('');
      setFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess(true);

    } catch (err: any) {
      console.error('Core Post Creation Workflow Failed:', err);
      setError(err.message || 'An error occurred while creating the post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase">Create New Post</h2>
          <p className="text-xs text-slate-400">Upload an image and post thoughts securely to Firebase</p>
        </div>
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
          <CheckCircle size={20} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input area */}
        <div>
          <label htmlFor="post-text-ref" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Whats on your mind?
          </label>
          <textarea
            id="post-text-ref"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isUploading}
            placeholder="Type your description or message here..."
            className="w-full h-28 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Input File button and drag representation */}
        <div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isUploading}
            className="hidden"
            id="post-image-file"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-4 px-6 border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.99]"
          >
            <ImageIcon size={24} className="text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">
              {file ? 'Replace Selected Image' : 'Click to Upload / Select Image'}
            </span>
            {file && (
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full font-semibold">
                {file.name}
              </span>
            )}
          </button>
        </div>

        {/* Interactive Image Preview Box */}
        {imagePreview && (
          <div className="relative border border-slate-800 rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center">
            <img 
              src={imagePreview} 
              alt="Post preview" 
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
            >
              Remove
            </button>
          </div>
        )}

        {/* Upload State representation */}
        {isUploading && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-indigo-400 flex items-center gap-1.5">
                <Loader2 className="animate-spin" size={14} />
                Uploading image and publishing...
              </span>
              <span className="text-slate-400 font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-500 h-1.5 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Dynamic Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-medium flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>Post uploaded and saved in Firebase successfully!</span>
          </div>
        )}

        {/* CTA Button */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-2xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all text-white"
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Publish Post</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreatePostDemo;
