import React from 'react';

const DocumentGuidance = () => {
  return (
    <div style={{
      backgroundColor: '#f0f8ff',
      border: '2px solid #1976d2',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ marginTop: 0, color: '#1565c0' }}>📚 How to Use This RAG System</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
        <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', border: '1px solid #4caf50' }}>
          <h3 style={{ marginTop: 0, color: '#2e7d32' }}>📄 Single Document Workflow</h3>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Upload 1 PDF/Document</strong> - Use "Upload document(s)" section</li>
            <li><strong>Ask Questions</strong> - Use "Ask a question" section to query your document</li>
            <li><strong>Get Answers</strong> - System searches and answers based on your document</li>
          </ol>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: 0 }}>
            <strong>Examples:</strong><br/>
            ✓ "Summarize the main points"<br/>
            ✓ "What are the key findings?"<br/>
            ✓ "List the advantages mentioned"
          </p>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '6px', border: '1px solid #ff9800' }}>
          <h3 style={{ marginTop: 0, color: '#e65100' }}>📊 Multiple Document Workflow</h3>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Upload 2+ PDFs/Documents</strong> - Use file selection and "Add more files"</li>
            <li><strong>Choose Your Analysis:</strong>
              <ul style={{ marginTop: '5px', marginBottom: '5px' }}>
                <li style={{ fontSize: '14px' }}><strong>Query:</strong> Ask general questions</li>
                <li style={{ fontSize: '14px' }}><strong>Compare:</strong> Analyze differences & similarities</li>
              </ul>
            </li>
            <li><strong>View Detailed Results</strong> - See answers with source attribution</li>
          </ol>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: 0 }}>
            <strong>Examples:</strong><br/>
            ✓ "Compare the approaches in these documents"<br/>
            ✓ "What are the main differences?"<br/>
            ✓ "Which document discusses...?"
          </p>
        </div>
      </div>

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fce4ec', borderRadius: '6px', borderLeft: '4px solid #c2185b' }}>
        <strong style={{ color: '#880e4f' }}>💡 Pro Tips:</strong>
        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', fontSize: '14px' }}>
          <li>You can add more files anytime by selecting additional files in the upload section</li>
          <li>Use the "Clear All" button to start fresh with a new set of documents</li>
          <li>The system remembers file sources and attributes content in results</li>
          <li>Query works great with 1 document, Compare requires at least 2 documents</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentGuidance;