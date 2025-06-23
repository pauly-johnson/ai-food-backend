# AI Food Creator Backend (Azure OpenAI)

This is a Node.js/Express backend for the AI Cooking Recipe App, using Azure's ModelClient for GPT-4.1 completions.

## Features
- POST `/generate-recipe`: Generate a recipe from ingredients, style, meal type, and user preferences.
- CORS enabled for `http://localhost:3000` (frontend).
- Handles errors and invalid input gracefully.
- Uses environment variables for sensitive data (Azure OpenAI key and endpoint).

## Setup & Run Locally

1. **Clone the repo and install dependencies:**
   ```sh
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and add your Azure OpenAI key and endpoint:
     ```sh
     cp .env.example .env
     # Then edit .env and set AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT
     ```

3. **Start the server:**
   ```sh
   npm run dev
   # or
   npm start
   ```
   The server will run on `http://localhost:5000` by default.

## API Endpoint

### POST `/generate-recipe`
- **Request Body (JSON):**
  ```json
  {
    "ingredients": ["chicken breast", "garlic", "lemon"],
    "style": "Grilling",
    "mealType": "Dinner",
    "why": "I like my chicken juicy and flavorful."
  }
  ```
- **Response (JSON):**
  ```json
  {
    "name": "Grilled Lemon Garlic Chicken",
    "cookingTime": "30 minutes",
    "ingredients": ["chicken breast", "garlic", "lemon", ...],
    "instructions": ["Step 1...", "Step 2...", ...]
  }
  ```

## Deployment
- Set the `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT` environment variables on Render or your chosen platform.
- The server listens on the port defined by the `PORT` environment variable (default: 5000).

---

**Contact:** For questions, open an issue or contact the maintainer.
