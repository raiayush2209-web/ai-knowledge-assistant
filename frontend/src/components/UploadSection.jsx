import { useState } from 'react';
import { uploadFile } from '../services/api.js';
import SectionCard from './SectionCard.jsx';
import { FaLightbulb, FaCheck, FaTimes } from 'react-icons/fa';

const UploadSection = ({ source, setSource, setStatus }) => {
  const [files, setFiles] = useState([]);
  const [uploadResults, setUploadResults] = useState(null);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!files.length) {
      setStatus('Please choose at least one file first.');
      return;
    }

    setStatus('Uploading documents...');
    setUploadResults(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('source', source || 'multiple-files');

    try {
      const result = await uploadFile('/api/upload', formData);
      setUploadResults(result);

      const successful = result.success && result.successfulFiles > 0;
      const message = successful
        ? `Indexed ${result.successfulFiles}/${result.totalFiles} file(s) successfully.`
        : 'Upload failed for all files.';
      setStatus(message);
    } catch (error) {
      setStatus(error.message);
      setUploadResults({ success: false, error: error.message });
    }
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prevFiles => {
      // Create a map of existing files by name and size to check for duplicates
      const existingFiles = new Map(prevFiles.map(file => [`${file.name}-${file.size}`, file]));

      // Add new files, skipping duplicates
      const newFiles = selectedFiles.filter(file => {
        const key = `${file.name}-${file.size}`;
        return !existingFiles.has(key);
      });

      return [...prevFiles, ...newFiles];
    });
    setUploadResults(null);

    // Clear the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setUploadResults(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SectionCard title="1. Upload document(s)">
      <form onSubmit={handleUpload}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.html"
            onChange={handleFileChange}
            style={{ marginBottom: '10px' }}
          />
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>
            <FaLightbulb style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            Select multiple files at once, or add more files by selecting again. Duplicates are automatically removed.
          </div>
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: '0', color: '#333' }}>Selected Files ({files.length}):</h4>
              <button
                type="button"
                onClick={() => setFiles([])}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear All
              </button>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {files.map((file, index) => (
                <li key={index} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{file.name}</strong> ({formatFileSize(file.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Source name (optional)"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </div>

        <button type="submit" disabled={files.length === 0}>
          Upload & Index {files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}
        </button>
      </form>

      {uploadResults && uploadResults.files && (
        <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #28a745', borderRadius: '4px', backgroundColor: '#f8fff9' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>Upload Results:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {uploadResults.files.map((fileResult, index) => (
              <li key={index} style={{
                marginBottom: '5px',
                color: fileResult.success ? '#155724' : '#721c24'
              }}>
                <strong>{fileResult.filename}</strong>: {fileResult.success ?
                  <><FaCheck style={{ color: '#10b981', marginRight: '0.5rem' }} /> Indexed successfully</> :
                  <><FaTimes style={{ color: '#ef4444', marginRight: '0.5rem' }} /> Failed - {fileResult.error}</>
                }
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#155724' }}>
            Total: {uploadResults.totalFiles} files, {uploadResults.successfulFiles || 0} successful
          </div>
        </div>
      )}
    </SectionCard>
  );
};

export default UploadSection;
