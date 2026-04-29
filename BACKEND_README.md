# RAG Backend - Modular Structure

This is a well-structured RAG (Retrieval-Augmented Generation) backend built with Node.js, Express, and Pinecone.

## Project Structure

```
├── config/
│   ├── database.js      # Pinecone database configuration
│   └── environment.js   # Environment variables and configuration
├── controllers/
│   ├── uploadController.js  # Upload-related business logic
│   └── queryController.js   # Query-related business logic
├── routes/
│   ├── index.js         # Main routes aggregator
│   ├── upload.js        # Upload routes
│   └── query.js         # Query routes
├── services/
│   ├── textExtraction.js    # Text extraction from files/URLs
│   ├── embedding.js         # AI embeddings and chat generation
│   └── pinecone.js          # Pinecone vector database operations
├── utils/
│   └── helpers.js       # Utility functions
├── server.js            # Main application entry point
├── package.json
└── .env                 # Environment variables
```

## API Endpoints

### Upload Endpoints
- `POST /api/upload` - Upload and index a file (DOCX, TXT, HTML)
- `POST /api/index-url` - Index content from a URL
- `POST /api/ingest-text` - Index raw text content

### Query Endpoints
- `POST /api/query` - Query the knowledge base
- `GET /api/health` - Health check

## Key Features

- **Modular Architecture**: Separated concerns with dedicated folders for routes, controllers, services, and utilities
- **File Processing**: Supports  DOCX, TXT, and HTML files
- **Vector Search**: Uses Pinecone for efficient similarity search
- **AI Integration**: Mistral AI for embeddings and chat completion
- **Text Chunking**: Intelligent text splitting for optimal retrieval

## Environment Variables

Create a `.env` file 

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Architecture Overview

1. **Routes** (`routes/`): Define API endpoints and delegate to controllers
2. **Controllers** (`controllers/`): Handle HTTP requests, validate input, call services
3. **Services** (`services/`): Core business logic (text extraction, embeddings, database operations)
4. **Config** (`config/`): Configuration management and database setup
5. **Utils** (`utils/`): Helper functions and utilities

This structure ensures maintainability, testability, and clear separation of concerns.