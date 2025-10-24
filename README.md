
# SmartBite - Your AI-Powered Sustainable Kitchen Assistant

Welcome to SmartBite, a next-generation smart kitchen application designed to empower you to live more sustainably. By revolutionizing your meal planning, cooking, and shopping experience, SmartBite acts as your personal guide to reducing food waste, making eco-conscious choices, and saving money.

## Core Features for Sustainable Living

SmartBite is packed with advanced features that work together to help you build a more sustainable kitchen.

### 1. Intelligent Inventory Management to Combat Food Waste
- **AI Bill Scanner**: Instantly digitize your grocery receipts by taking a photo. The AI extracts items, quantities, and prices, adding them directly to your inventory.
- **AI Pantry Scanner**: Use your camera to scan multiple grocery items at once. The AI identifies each item for quick inventory updates.
- **Voice-Powered Input**: Add items to your inventory simply by speaking, making it effortless to keep your pantry up-to-date.
- **Predictive Edibility Engine**: Goes beyond simple dates to predict the true edibility of fresh produce using AI, giving you an "Edibility Score" to help prioritize what to use first.
- **Pantry Essentials**: Keep a separate list of staples you always have on hand, which are automatically included in recipe suggestions.

### 2. Predictive & Sustainable Cooking
- **Waste-Reduction Recipes**: Get recipe ideas based on ingredients that are about to expire to ensure you use them in time.
- **Predictive Suggestions**: The AI analyzes your habits to predict what you might want to cook next.
- **Mood-Based Suggestions**: Feeling tired or celebratory? The app suggests the perfect meal to match your mood, using ingredients you already own.
- **AI Taste Predictor**: Transform any recipe to match your preferences (e.g., "make it vegan," "make it spicier") without needing to buy new, special ingredients.
- **Ingredient Reincarnation**: When an item expires, the AI shows you a creative recipe that *could have been made*, turning waste into a learning opportunity.

### 3. Advanced Culinary Tools
- **Plate Scanner**: Snap a photo of your meal, and the AI will identify it, estimate its nutritional content, and find a recipe.
- **Flavor Sustainability Index**: Missing an ingredient? The AI suggests smart, scientifically-backed substitutions that are both functional and have a lower environmental impact.
- **Multimedia Recipes**: Recipes come alive with AI-generated step-by-step images, full audio narration, and a cinematic summary video for the finished dish.

### 4. Environmental & Financial Insight
- **AI Health & Financial Coach**: Get a detailed analysis of your grocery shopping habits, with insights on your nutritional breakdown and predictive budget optimization suggestions.
- **Carbon Footprint Analysis**: Understand the environmental impact of your groceries with an AI-powered carbon footprint estimate and get tips for more sustainable shopping.
- **Sustainability Shadow Tracker**: A dedicated dashboard tracks your "carbon debt," which grows with purchases and shrinks with sustainable actions like cooking at home.
- **Circular Kitchen Simulator**: Visualizes your kitchen as a closed-loop ecosystem, tracking ingredients from purchase to reuse and showing you how to "close the loop" on waste.
- **Kitchen Resilience Score**: The AI scores your pantry's ability to withstand supply chain shocks, giving you tips to build a more resilient food system at home.

### 5. Smart Shopping & Planning
- **AI Meal Planner**: Generate a complete 7-day meal plan based on your available ingredients and nutritional goals.
- **Collaborative Shopping Helper**: Use the "Smart Lens" to scan an item in the grocery store. The AI identifies it and checks if you or a family member already have it at home, preventing duplicate purchases.
- **Pantry Chat Assistant**: Ask natural language questions about your inventory (e.g., "Do I have any milk left?") and get instant answers from the AI.

## Project Aura: The Future Vision

Project Aura is the conceptual hardware ecosystem that represents the ultimate vision for SmartBite—a fully autonomous, "conscious" kitchen. It includes:
- **Aura Rail:** An intelligent backsplash that projects an interactive UI onto your countertop.
- **Aura Knife:** A culinary knife with an embedded spectrometer for real-time food analysis.
- **Gecko Sensors:** Ambient, energy-harvesting sensors for zero-effort, automated inventory tracking.

This system aims to create a frictionless feedback loop where the kitchen manages its own resources and proactively guides the user toward a zero-waste lifestyle.

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

    