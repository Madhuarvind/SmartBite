
# SmartBite Application: Code Explanation

This document provides a detailed, step-by-step explanation of how the SmartBite application code is structured and how it functions.

---

## 1. High-Level Architecture

The application is built on a modern, three-tier architecture that separates concerns for scalability and maintainability:

1.  **Client-Side (Browser):** This is the user interface that the user interacts with. It's built with **Next.js** and **React**, using **ShadCN UI** for components and **Tailwind CSS** for styling. It's responsible for rendering data and capturing user input.

2.  **Server-Side (Next.js & Genkit):** This is the application's "brain." It runs on the Next.js server environment and uses **Genkit** to orchestrate all AI-related tasks. This layer contains all the intelligent logic, such as analyzing images, generating recipes, and providing insights.

3.  **External Services (Firebase & Google AI):** This layer provides the necessary backend infrastructure.
    *   **Firebase:** Used for the database (**Firestore**) and user authentication (**Firebase Auth**).
    *   **Google AI:** Provides the powerful generative models (**Gemini** for text and vision, **Veo** for video) that the Genkit flows call upon.

**How it Works (The Flow of Data):**

```mermaid
graph TD
    subgraph "Client-Side (Browser)"
        A[1. User interacts with a React Component]
    end

    subgraph "Server-Side (Next.js & Genkit)"
        B[2. A Next.js Server Action is called]
        C[3. The Server Action invokes a Genkit AI Flow]
        D[4. The AI Flow calls a Google AI model and/or a Tool]
        E[5. A Genkit Tool interacts with Firebase SDK]
    end

    subgraph "External Services"
        F[6. Firebase (Auth/Firestore) for data]
        G[7. Google AI (Gemini/Veo) for generation]
    end

    A -- "e.g., Clicks 'Scan Receipt'" --> B
    B -- "e.g., `scanReceipt(photo)`" --> C
    C --> D
    D -- "Calls Model" --> G
    D -- "Uses Tool" --> E
    E -- "Reads/Writes Data" --> F
```

---

## 2. File-by-File Breakdown

This section explains the purpose and functionality of the key files and directories in the project.

### 2.1. Project Configuration

*   **`package.json`**: This file is the manifest for the project. It lists all the project dependencies (like React, Next.js, Firebase, Genkit, Tailwind CSS) and defines the scripts to run, build, and develop the application (`npm run dev`, `npm run build`, etc.).
*   **`next.config.ts`**: The configuration file for the Next.js framework. It's used to set up rules for things like image optimization (allowing images from `picsum.photos`) and to enable Next.js Server Actions, which are crucial for client-server communication.
*   **`tailwind.config.ts`**: The configuration file for Tailwind CSS. It defines the application's design system, including the color palette (using CSS HSL variables for easy theming), fonts, and other stylistic properties.
*   **`tsconfig.json`**: The configuration file for TypeScript. It sets the rules for how the TypeScript compiler should check the code for errors, ensuring type safety across the project. The `paths` alias (`@/*`) allows for clean, absolute imports (e.g., `@/components/ui/button`).

### 2.2. Application Entrypoint & Layouts

*   **`src/app/layout.tsx`**: This is the root layout for the entire application. It defines the main `<html>` and `<body>` tags and includes the global stylesheet (`globals.css`) and the `Toaster` component for displaying notifications. Every page in the app is rendered within this layout.
*   **`src/app/page.tsx`**: This is the initial landing page. Its primary job is to check the user's authentication status using Firebase. If the user is logged in, it redirects them to the `/dashboard`. If not, it redirects them to the `/login` page. This ensures no one can access the main app without being authenticated.
*   **`src/app/(auth)/layout.tsx`**: A simple layout specifically for the authentication pages (`/login`, `/register`). It centers the content on the screen, providing a clean, focused view for signing in or signing up.
*   **`src/app/(app)/layout.tsx`**: This is the main application shell for logged-in users. It's a critical file that sets up the primary user interface, including the main navigation sidebar and the header with the user profile dropdown. All the main application pages (like Dashboard, Inventory, etc.) are rendered inside this layout.

### 2.3. Authentication (`src/app/(auth)/*`)

*   **`login/page.tsx`**: This component renders the login form.
    *   **State:** Uses `useState` to manage the user's email and password input.
    *   **Functionality:** The `handleLogin` function calls Firebase Auth's `signInWithEmailAndPassword` method. The `handleGoogleLogin` function uses `signInWithPopup` for Google OAuth. On success, it redirects the user to the `/dashboard`. On failure, it displays an error message using the `useToast` hook. It also includes a dialog for resetting a forgotten password.
*   **`register/page.tsx`**: This component renders the registration form.
    *   **State:** Manages user input for first name, last name, email, and password.
    *   **Functionality:** The `handleRegister` function uses Firebase Auth's `createUserWithEmailAndPassword`. Upon successful creation, it calls `updateProfile` to set the user's display name and then calls `populateInitialData`. This function seeds the user's new Firestore database with a set of default inventory and pantry items, giving them a good starting point. Finally, it sends a verification email and redirects to the login page.

### 2.4. Core AI Flows (`src/ai/flows/*`)

This directory is the "brain" of the application. Each file defines a specific AI-powered task. Every flow file starts with `'use server';` to mark it as a server-side module that can be securely called from the client.

*   **`scan-receipt.ts`**:
    *   **Purpose:** To extract items, quantities, and prices from a photo of a grocery receipt.
    *   **How it Works:** It takes an image data URI, passes it to the Gemini vision model with a specific prompt asking it to perform Optical Character Recognition (OCR) and data extraction. After getting the items, it loops through any "fresh" items and calls the `predictEdibility` flow to get a predicted expiry date for them.
*   **`recommend-recipes.ts`**:
    *   **Purpose:** To generate recipe recommendations.
    *   **How it Works:** It takes a list of selected ingredients from the user. It sends these to the AI with a prompt asking it to create 4 creative recipes. After the text-based recipes are generated, it calls the `generateImage` flow in parallel for each recipe to create a cover image.
*   **`analyze-plate.ts`**:
    *   **Purpose:** To identify a meal from a photo and estimate its nutritional content.
    *   **How it Works:** Takes an image of a meal and sends it to the AI. The prompt asks the model to identify the dish and return its estimated calories, protein, carbs, and fat.

---
### 2.5. Advanced Sustainability AI Flows

This section details the workings of the most advanced AI features you recently added, focusing on how they promote a sustainable kitchen.

*   **`invent-recipe.ts` (AI Ingredient Reincarnation Generator):**
    *   **Purpose:** This is the engine behind the "Waste Reversal Simulator." It doesn't just find existing recipes; it *invents* a new, creative dish from a given list of ingredients.
    *   **How it Works (Step-by-Step):**
        1.  **Trigger:** This flow is triggered in `inventory/page.tsx` when a user deletes an item that the system has marked as expired.
        2.  **Ingredient Gathering:** The function gathers the name of the wasted item (e.g., "Brown Bananas") and a few other random ingredients currently in the user's inventory.
        3.  **AI Prompt:** It sends these ingredients to the Gemini model with a powerful prompt instructing it to act as a "Creative Chef AI" and invent a unique recipe.
        4.  **Cost Calculation:** The flow includes a helper function that calculates the `estimatedCost` of the invented recipe by looking up the prices of the used ingredients from the user's purchase history (stored when receipts are scanned).
        5.  **Output:** The flow returns a full recipe object, including the creative name, ingredients, instructions, and the calculated cost.
        6.  **User Feedback:** The `inventory` page then uses this output to display a toast notification like: *"Your Brown Bananas could have been reincarnated as 'Spiced Banana Bread' (Est. Cost: ₹120.00)."* This provides a powerful, tangible lesson about the creative and financial value lost to waste.

*   **`get-kitchen-resilience-score.ts` (AI Kitchen Resilience Forecast):**
    *   **Purpose:** This flow models your kitchen's ability to withstand supply chain disruptions by scoring its inventory.
    *   **How it Works (Step-by-Step):**
        1.  **Trigger:** This flow is called from the `health/page.tsx` component when it loads.
        2.  **Data Input:** It receives the user's entire `inventoryItems` (fresh goods) and `pantryEssentials` (shelf-stable staples).
        3.  **AI Prompt:** The data is sent to the Gemini model with a prompt that instructs it to act as a "food security expert." The prompt outlines the scoring criteria: high impact for pantry essentials and shelf-stable items, medium impact for diversity, and low impact for having too many fresh items without backups.
        4.  **Analysis & Scoring:** The AI analyzes the lists based on these criteria and calculates a single **Resilience Score** between 0 and 100.
        5.  **Insight & Suggestions:** The AI also generates a concise `keyInsight` (e.g., "Your pantry has good diversity but lacks core staples") and three actionable `suggestions` for improvement.
        6.  **UI Display:** The `health` page receives this structured data and displays it in the "AI Kitchen Resilience Score" card, showing the score, insight, and upgrade suggestions.

*   **`analyze-waste-patterns.ts` (AI Sustainability Causality Engine):**
    *   **Purpose:** This flow was upgraded to be a "Causality Engine." It goes beyond *what* is wasted to infer *why* it's being wasted.
    *   **How it Works (Step-by-Step):**
        1.  **Trigger:** Called by the `health/page.tsx` component.
        2.  **Data Input:** It's given the user's `wasteHistory`, which is a list of all items they've marked as wasted.
        3.  **AI Prompt:** The prompt instructs the AI to act as a sustainability coach. It asks the model to identify the most frequently wasted item and then, crucially, to infer a **causal link** for the waste pattern and formulate it as a `keyInsight`.
        4.  **Causal Inference:** The AI doesn't just state "You waste lettuce." It generates a hypothesis: *"Buying leafy greens in large quantities seems to be leading to spoilage before they can be used."*
        5.  **Actionable Suggestions:** Based on this inferred cause, it then provides three highly relevant suggestions (e.g., "Try buying spinach in smaller quantities," "Plan a salad for the day you shop").
        6.  **UI Display:** This insight and the tailored suggestions are displayed in the "AI Causality Engine" card on the Health & Impact page, giving the user a much deeper understanding of their habits.

*   **`get-sustainability-nudge.ts` (AI Kitchen Consciousness Drift Model):**
    *   **Purpose:** This flow acts as the "voice" of the Kitchen Consciousness. It monitors the user's behavior over time and provides proactive nudges to prevent "sustainability drift."
    *   **How it Works (Step-by-Step):**
        1.  **Trigger:** Called by the `dashboard/page.tsx` when it loads.
        2.  **Data Input:** It receives a summary of the user's last 7 days of activity: `weeklyMealsCooked`, `weeklyItemsWasted`, `weeklySpending`, and `currentInventoryCount`.
        3.  **AI Prompt:** The prompt instructs the AI to act as a "warm, encouraging, and insightful behavioral psychologist." It provides examples of good nudges for different data scenarios (e.g., if waste is high, suggest using a specific feature; if cooking is high, offer praise).
        4.  **Behavioral Analysis:** The AI analyzes the data and generates a single, personalized, and actionable `nudge`.
        5.  **UI Display:** This nudge is then displayed prominently on the Dashboard in the "Your Daily Nudge" card, acting as the kitchen's proactive "thought for the day."

---
### 2.6. AI Schemas & Tools

*   **`src/ai/schemas.ts`**: This is a critical file for ensuring type safety. It uses the **Zod** library to define the exact shape of the data that each AI flow expects as input (`InputSchema`) and what it should return as output (`OutputSchema`). This prevents runtime errors and makes the AI's responses predictable and easy to work with on the frontend.
*   **`src/ai/tools/check-inventory.ts`**: This file defines a **Genkit Tool**. A tool is a function that the AI can decide to use to get more information.
    *   **Purpose:** To allow the AI to check if a specific item exists in the user's (or their family's) inventory.
    *   **How it Works:** The `checkInventoryTool` is defined with a name, a description (so the AI knows what it's for), and input/output schemas. The main function inside it connects directly to Firestore, queries the `inventory` and `pantry_essentials` collections, and returns a boolean indicating if the item was found and its quantity. The `askPantryAssistant` flow uses this tool to answer user questions like "Do we have milk?".

### 2.7. UI Pages & Components

*   **`src/app/(app)/dashboard/page.tsx`**: The main landing page for logged-in users. It fetches and displays expiring items, a weekly summary chart of meals vs. waste, a spending chart, the user's "Carbon Debt," and the AI-powered "Daily Nudge." It uses `onSnapshot` listeners from Firebase to get real-time updates for the inventory.
*   **`src/app/(app)/inventory/page.tsx`**: The inventory management hub.
    *   **Functionality:** It displays two tabs: "My Items" (perishable goods) and "Pantry Essentials" (staples). It contains the "AI Scanner" card which allows users to add items via camera scan, image upload, or voice input. It includes dialogs for adding items manually and for seeing AI-powered preservation suggestions when an item is about to expire.
*   **`src/app/(app)/bill-scanner/page.tsx`**:
    *   **Functionality:** This page allows the user to upload a photo of a receipt. It then calls the `scanReceipt` flow. Once the items are extracted, they are displayed in a table. The page also calls the `calculateCarbonFootprint` flow and displays the result. The user can then click "Add to Inventory" to save all the scanned items to their Firestore database.
*   **`src/app/(app)/recipes/page.tsx`**: The main recipe discovery page.
    *   **Functionality:** It allows users to generate recipes in multiple ways:
        1.  **Recipe Finder:** Select ingredients from a checklist to call `recommendRecipes`.
        2.  **Mood Suggestions:** Type a mood or scan their face (`predictFacialMood`) to call `suggestRecipesByMood`.
        3.  **Predictive Suggestions:** Calls `predictiveSuggestions` which analyzes their history.
        4.  **Creative Chef:** Calls `inventRecipe` to create something new.
    *   **Recipe Modal:** When a recipe is clicked, it opens a detailed dialog showing ingredients, instructions, and several AI helper tools (Substitution Helper, AI Taste Predictor, Audio/Video Generation).
*   **`src/components/ui/*`**: This directory contains all the reusable, low-level UI components (Button, Card, Input, etc.) provided by **ShadCN UI**. These are the building blocks of the entire user interface.
*   **`src/components/page-header.tsx`**: A simple, reusable component for displaying the title of each page.

### 2.8. Firebase and Data Handling

*   **`src/lib/firebase.ts`**: This file initializes the connection to the Firebase project using the configuration details provided. It exports the initialized `app`, `auth` (for authentication), and `db` (for Firestore) instances so they can be used throughout the application.
*   **`src/lib/types.ts`**: Defines the core TypeScript types for data objects used in the app, such as `InventoryItem`, `PantryItem`, and `RecipeHistoryItem`. This ensures data consistency between Firestore and the frontend components.
*   **`src/lib/inventory.ts`**: Contains the default lists of `initialInventory` and `pantryEssentials` that are used to populate a new user's database upon registration.

This breakdown provides a clear, step-by-step guide to how the SmartBite application is built, from its foundational configuration to its most advanced AI features.
