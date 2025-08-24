
# SmartBite - AI-Powered Smart Kitchen Assistant

Welcome to SmartBite, a next-generation smart kitchen application designed to revolutionize your meal planning, cooking, and shopping experience. Powered by cutting-edge AI, SmartBite acts as your personal chef, nutritionist, and financial advisor, all in one intuitive interface.

## Core Features

SmartBite is packed with advanced features that work together to save you time, money, and reduce food waste.

### 1. Intelligent Inventory Management
- **AI Bill Scanner**: Instantly digitize your grocery receipts by taking a photo. The AI extracts items, quantities, and prices, adding them directly to your inventory.
- **AI Pantry Scanner**: Use your camera to scan multiple grocery items at once. The AI identifies each item and its quantity for quick inventory updates.
- **Voice-Powered Input**: Add items to your inventory simply by speaking.
- **Predictive Expiry**: For fresh produce, the AI predicts expiry dates to help you prioritize what to use first.
- **Pantry Essentials**: Keep a separate list of staples you always have on hand, which are automatically included in recipe suggestions.

### 2. Predictive & Personalized Cooking
- **Predictive Suggestions**: The AI analyzes your purchase history, cooking habits, and available ingredients to predict what you might want to cook next.
- **Recipe Recommendations**: Get recipe ideas based on the specific ingredients you have available, prioritizing items that are about to expire.
- **Mood-Based Suggestions**: Feeling tired, stressed, or celebratory? The app can suggest the perfect meal to match your mood, which can be entered manually or detected via your device's camera using **Facial Mood Prediction**.
- **AI Taste Predictor**: Transform any recipe to match your personal "flavor genome." Make dishes spicier, healthier, vegan, or more creative with a simple text command.

### 3. Advanced Culinary Tools
- **Plate Scanner**: Don't know what you ate? Snap a photo of your meal, and the AI will identify it, estimate its nutritional content, and even find a recipe for it.
- **Ingredient Substitution Engine**: Missing an ingredient? The AI suggests smart, scientifically-backed substitutions from your available pantry items.
- **Multimedia Recipes**: Recipes come alive with AI-generated step-by-step images, full audio narration, and a cinematic summary video for the finished dish.

### 4. Health & Financial Insight
- **AI Health Coach**: Get a detailed analysis of your grocery shopping habits, with insights on your nutritional breakdown and actionable suggestions for a healthier lifestyle.
- **AI Financial Advisor**: The app analyzes your spending patterns from scanned receipts and provides predictive budget optimization suggestions to help you save money.
- **Carbon Footprint Analysis**: Understand the environmental impact of your groceries with an AI-powered carbon footprint estimate and get tips for more sustainable shopping.
- **Sustainability Tracking**: A dedicated dashboard tracks meals cooked, food waste saved, and badges earned on your journey to a more sustainable kitchen.

### 5. Smart Shopping & Planning
- **AI Meal Planner**: Generate a complete 7-day meal plan based on your available ingredients, nutritional goals, and dietary restrictions. The AI also generates a shopping list for any missing items.
- **Collaborative Shopping Helper**: Use the "Smart Lens" to scan an item in the grocery store. The AI identifies it and checks if you or a family member already have it at home, preventing duplicate purchases.
- **Pantry Chat Assistant**: Ask natural language questions about your inventory (e.g., "Do I have any milk left?") and get instant answers from the AI.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Radix UI and ShadCN for components.
- **Generative AI**: Google's Gemini models, orchestrated with Genkit.
- **Backend & Database**: Firebase (Firestore for database, Firebase Auth for authentication).

## Architecture

The application follows a modern web architecture, separating the client-side UI from the server-side AI logic.

```mermaid
graph TD
    subgraph "Client-Side (Browser)"
        A[Next.js Frontend - React Components]
    end

    subgraph "Server-Side (Next.js & Genkit)"
        B[Genkit AI Flows <br/> e.g., recommendRecipes]
        C[Genkit Tools <br/> e.g., checkInventory]
        D[Firebase SDK]
    end

    subgraph "External Services"
        E[Firebase <br/> (Auth, Firestore)]
        F[Google AI <br/> (Gemini & Veo)]
    end

    A -- "Server Action Call" --> B
    B -- "Uses Tool" --> C
    C -- "Queries/Mutates Data" --> D
    D -- "Interacts with" --> E
    B -- "Calls Generative Model" --> F
    A -- "Reads Data via Firebase SDK" --> E

    style A fill:#F0C808,stroke:#4D450A,stroke-width:2px,color:#4D450A
    style B fill:#F07208,stroke:#4D450A,stroke-width:2px,color:#4D450A
    style C fill:#F07208,stroke:#4D450A,stroke-width:2px,color:#4D450A
    style D fill:#F07208,stroke:#4D450A,stroke-width:2px,color:#4D450A
    style E fill:#4CAF50,stroke:#4D450A,stroke-width:2px,color:#fff
    style F fill:#4285F4,stroke:#4D450A,stroke-width:2px,color:#fff
```

## Project Structure

- `src/app/`: Contains all the application pages, following the Next.js App Router structure.
  - `(app)/`: Logged-in user routes and main application layout.
  - `(auth)/`: Authentication routes (login, register).
- `src/ai/`: Home for all AI-related logic.
  - `flows/`: Contains all the Genkit flows that define the core AI features.
  - `tools/`: Genkit tools that allow the AI to interact with external services (like our database).
  - `schemas.ts`: Centralized Zod schemas for type-safe AI inputs and outputs.
- `src/components/`: Shared React components.
  - `ui/`: UI components from ShadCN.
- `src/lib/`: Core utility functions, Firebase configuration, and type definitions.
- `src/hooks/`: Custom React hooks.

## Getting Started

### Prerequisites
- Node.js and npm
- A Firebase project

### 1. Setup Environment Variables

Create a `.env` file in the root of the project. You will need to get your Firebase project's web configuration object and populate the `.env` file. You can find this in your Firebase project settings.

**Note:** The application is pre-configured to use a demo Firebase project. To use your own, you must update the configuration in `src/lib/firebase.ts`.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Servers

This project requires two separate development servers to run concurrently in two separate terminals.

**Terminal 1: Run the Next.js Frontend**
This serves the main application UI.
```bash
npm run dev
```
The app will be available at `http://localhost:9002`.

**Terminal 2: Run the Genkit AI Flows**
This serves the AI backend that powers all the smart features.
```bash
npm run genkit:dev
```
This will start the Genkit development server, making the AI flows available for the frontend to call.

You are now ready to explore all the features of SmartBite!
