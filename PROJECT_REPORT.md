# SmartBite Project Report

## Introduction

### Brief background of the problem

In today's fast-paced world, managing a home kitchen efficiently has become a significant challenge for many households. The daily routine of meal planning, grocery shopping, inventory tracking, and cooking is often fragmented and time-consuming. This leads to several common problems:
- **Food Waste:** Ingredients are often forgotten or purchased in excess, leading to spoilage and significant financial and environmental costs. The UN Environment Programme estimates that household food waste accounts for a substantial portion of global waste.
- **Decision Fatigue:** Deciding what to cook daily is a cognitive burden, often resulting in repetitive, less-than-healthy meal choices or a reliance on expensive takeout.
- **Budgetary and Health Concerns:** Without proper tools, it's difficult to track grocery spending, manage nutritional intake, and align cooking habits with health and financial goals.

### Why this project is important

The SmartBite project is important because it offers a holistic, AI-driven solution to these modern kitchen challenges. By integrating inventory management, recipe generation, meal planning, and health and financial analysis into a single, intuitive platform, SmartBite empowers users to make smarter decisions. It aims to revolutionize the home cooking experience, making it more enjoyable, sustainable, and aligned with personal wellness goals. This project is not just about convenience; it's about reducing food waste, promoting healthier lifestyles, and saving users valuable time and money.

## Problem Statement

The core challenge this project addresses is the inefficiency and lack of intelligence in traditional home kitchen management. Households lack a centralized system that connects their inventory of available ingredients with their meal planning, cooking, health, and financial activities. This gap results in suboptimal decision-making, leading directly to food and money waste, nutritional imbalances, and the daily stress of meal preparation. The project tackles the specific problem of how to leverage modern AI to create a proactive, personalized kitchen assistant that closes this loop, turning a reactive chore into a streamlined, intelligent process.

## Objectives

The primary objectives of the SmartBite project are to:

1.  **Develop an Intelligent Inventory Management System:** Create a system that can automatically digitize groceries from receipts and camera scans, track items, and predict expiry dates for fresh produce to minimize food waste.
2.  **Implement AI-Powered Recipe Generation:** Build a suite of AI agents capable of recommending, inventing, and transforming recipes based on available ingredients, dietary needs, user mood, and taste preferences.
3.  **Provide Comprehensive Culinary Assistance:** Enhance the cooking experience by generating multimedia recipe content, including step-by-step images, audio narration, and summary videos.
4.  **Integrate Health and Financial Coaching:** Create AI flows that analyze user purchasing habits to provide actionable insights on nutrition, spending patterns, and environmental impact.
5.  **Build an Intuitive and Seamless User Experience:** Design a user-friendly interface using a modern web stack (Next.js, Tailwind CSS) that makes all features easily accessible and engaging.
6.  **Create a Smart, Collaborative Shopping Experience:** Develop tools that prevent duplicate purchases within a family and provide on-the-go assistance in the grocery store.

## Literature Review / Related Work

While numerous recipe apps (e.g., Allrecipes, Yummly) and grocery list apps (e.g., AnyList) exist, they typically operate in silos. Recipe apps suggest meals without knowing the user's actual inventory, and grocery apps help with shopping but don't assist in using the items purchased.

Some existing solutions have attempted to bridge this gap:
- **SuperCook:** Recommends recipes based on user-inputted ingredients. Its limitation lies in the manual and tedious nature of inventory management.
- **Mealime:** Excels at meal planning and generating shopping lists but lacks dynamic inventory tracking and cannot adapt suggestions if the user cooks something off-plan or buys extra items.
- **MyFitnessPal:** Focuses heavily on calorie and nutrient tracking but does not connect this data back to inventory management or predictive recipe suggestions.

SmartBite's novelty lies in its comprehensive integration. It uses multimodal AI (vision, text, voice) to automate inventory input, generative AI to create a dynamic and personalized cooking experience, and analytical AI to provide coaching. It closes the loop from shopping to eating to analysis, a feature largely absent in existing solutions.

## Proposed System / Methodology

The proposed system is a modern, full-stack web application that leverages a client-server architecture, with a strong emphasis on server-side AI processing.

### Architecture or workflow diagram

The application's architecture is designed for scalability and clear separation of concerns.

**AI Image Generator Prompt for Figure 1: System Architecture**

```text
Create a clean, modern, technical system architecture diagram for an IEEE conference paper. The diagram should illustrate the workflow of an AI application called "SmartBite". Use a formal, minimalist style with clear labels and directed arrows. The diagram must have three distinct vertical lanes or columns, each with a clear heading.

**Column 1: "Client-Side (Browser)"**
*   This column should contain one primary box labeled: **"Next.js Frontend - React Components"**.
*   This box represents the user interface. Use a vibrant yellow-gold color for this box, with dark text.

**Column 2: "Server-Side (Next.js & Genkit)"**
*   This column represents the application's backend logic. It should be the central column.
*   Inside this column, create a large container to hold several components.
*   Within this container, add three distinct sub-boxes arranged vertically:
    1.  Top box: **"Genkit AI Flows (e.g., recommendRecipes, scanReceipt)"**
    2.  Middle box: **"Genkit Tools (e.g., checkInventory)"**
    3.  Bottom box: **"Firebase SDK"**
*   Use a bright, peachy-coral orange color for these server-side boxes, with dark text.

**Column 3: "External Services"**
*   This column represents the third-party cloud services.
*   It should contain two boxes, stacked vertically:
    1.  Top box: **"Firebase (Auth, Firestore)"**. Color this box green, with white text.
    2.  Bottom box: **"Google AI (Gemini & Veo Models)"**. Color this box blue, with white text.

**Connections (Arrows):**
Draw clear, labeled, directed arrows to show the data flow between the boxes.
1.  From **"Next.js Frontend"** to **"Genkit AI Flows"**, label the arrow: **"Server Action Call"**.
2.  From **"Genkit AI Flows"** to **"Genkit Tools"**, label the arrow: **"Uses Tool"**.
3.  From **"Genkit Tools"** to **"Firebase SDK"**, label the arrow: **"Queries/Mutates Data"**.
4.  From **"Firebase SDK"** to the **"Firebase"** box in the third column, label the arrow: **"Interacts with"**.
5.  From **"Genkit AI Flows"** to the **"Google AI"** box in the third column, label the arrow: **"Calls Generative Model"**.
6.  Draw a final arrow directly from the **"Firebase"** box in the third column back to the **"Next.js Frontend"** in the first column. Label this arrow: **"Reads Data via Firebase SDK"**.
```

### Steps/methods you followed

1.  **Foundation & UI:** The project was initiated with Next.js (App Router) for the frontend, with ShadCN UI and Tailwind CSS for a modern, component-based design system.
2.  **Backend & Database:** Firebase was chosen for its comprehensive BaaS (Backend-as-a-Service) offering, using Firestore for the NoSQL database and Firebase Auth for user management.
3.  **AI Orchestration:** Genkit was integrated to manage and orchestrate all interactions with Google's generative AI models (Gemini and Veo). This involved defining structured schemas (using Zod) for type-safe inputs and outputs.
4.  **Feature Implementation (AI Flows):** Core features were built as individual, self-contained AI "flows" in Genkit. For example, `scanReceipt`, `recommendRecipes`, and `analyzeHealthHabits` were created as distinct server-side functions.
5.  **Tool Development:** To allow AI flows to interact with the database, Genkit "tools" were developed. The `checkInventoryTool`, for instance, gives the AI the ability to query the Firestore database to see what ingredients a user has.
6.  **Client-Side Integration:** The React frontend was connected to the Genkit flows using Next.js Server Actions, allowing for secure and efficient communication between the client and server.
7.  **Iterative Refinement:** Each feature was built and tested iteratively, focusing on creating a seamless and intelligent user experience.

## Technologies Used

The proposed system is implemented using a modern web stack:

-   **Framework:** Next.js (with App Router)
-   **Programming Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** ShadCN UI, Radix UI
-   **Generative AI:** Google's Gemini models (for vision, text, and image generation) and Veo (for video generation).
-   **AI Orchestration:** Genkit
-   **Backend & Database:** Firebase (Firestore, Authentication)
-   **State Management:** React Hooks (`useState`, `useEffect`)

## Implementation

The proposed system incorporates the following key features, implemented as distinct AI flows:

-   **Automated Inventory Scanning:** Utilizes the Gemini vision model in `scanReceipt` and `scanIngredients` flows to perform OCR and object recognition on images, automatically digitizing grocery items.
-   **Predictive Expiry Date Generation:** The `predictExpiryDate` flow leverages the Gemini model's knowledge base to estimate the shelf life of fresh ingredients, crucial for waste reduction.
-   **Context-Aware Recipe Generation:** The `recommendRecipes`, `suggestRecipesByMood`, and `inventRecipe` flows generate personalized recipes based on user inventory, mood, and preferences.
-   **Asynchronous Multimedia Generation:** The system enhances recipes by asynchronously generating step-by-step images (`generateRecipeStepImage`), audio narration (`generateRecipeAudio`), and summary videos (`generateRecipeVideo`) in the background.
-   **AI-Powered Recipe Transformation:** The `transformRecipe` flow acts as an "AI Taste Predictor," re-engineering entire recipes based on natural language requests (e.g., "make it vegan").
-   **Integrated Financial & Health Coaching:** The `analyzeUserSpending` and `analyzeHealthHabits` flows process purchase history to generate charts and actionable advice.
-   **Collaborative Shopping Assistance:** The `identifyAndCheckItem` and `askPantryAssistant` flows use a Genkit tool (`checkInventoryTool`) to check family inventory in real-time, preventing duplicate purchases.

These features work in concert to provide a comprehensive and intelligent kitchen management solution.

## Results / Output

The final application is a fully functional prototype that successfully implements all the core objectives. Users can scan receipts, manage their inventory, and receive intelligent, personalized recipe recommendations. The multimedia content for recipes is generated successfully, and the health and financial dashboards provide meaningful insights based on user data.

| Feature               | Status      | Key Result                                                                               |
| --------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| AI Bill Scanner       | Implemented | Successfully extracts items, prices, and quantities from receipt photos.                 |
| Recipe Recommendation | Implemented | Generates 4 relevant recipes based on selected ingredients.                              |
| Multimedia Generation | Implemented | Asynchronously generates step images, audio narration, and a summary video for recipes.    |
| Health/Financial Coach  | Implemented | Analyzes purchase history to produce spending breakdowns and actionable tips.            |
| Plate Scanner         | Implemented | Identifies a meal from a photo and provides its estimated nutritional content.            |
| AI Taste Predictor    | Implemented | Successfully transforms existing recipes based on natural language text prompts.           |

## Evaluation & Analysis

The system's performance can be evaluated on several metrics:
-   **Accuracy:** The accuracy of the AI scanners (`scanReceipt`, `analyzePlate`) is high for clear images but degrades with poor lighting or blurry photos. The `predictExpiryDate` flow provides reasonable estimates that align with general food science knowledge.
-   **Efficiency:** Text-based AI flows respond within 2-5 seconds. Image-based analysis takes 5-10 seconds. Multimedia generation is the most time-intensive process, with audio taking ~15-30 seconds and video generation taking 1-3 minutes. The implementation of asynchronous background processing for media is therefore critical to good user experience.
-   **User Experience:** The separation of the UI from the AI logic ensures the application remains responsive. Recipe details are shown instantly, with media loading in as it becomes available, which is a significant improvement over a fully synchronous model.
-   **Scalability:** The use of Firebase and serverless AI flows means the architecture is highly scalable and can handle a large number of users without manual intervention.

## Hardware Requirements for "Aura" Prototype

This section outlines the hardware components required to build a functional prototype of the advanced "SmartBite Aura" system, which integrates physical sensors and interfaces into the SmartBite ecosystem.

### 1. Aura Rail (Intelligent Backsplash Hub)
The Aura Rail serves as the central command and display unit, projected onto the countertop.

-   **Processing Unit:** A single-board computer (e.g., Raspberry Pi 4 or later) to manage sensors, run local logic, and communicate with the cloud backend.
-   **Projection System:** A pico-projector with short-throw lens capabilities to display an interactive UI on a standard countertop.
-   **Gesture Sensor:** A time-of-flight (ToF) camera module (e.g., VL53L1X) for detecting hand gestures to control the projected interface.
-   **Wireless Communication:** Wi-Fi and Bluetooth module (typically included with the single-board computer) for connecting to the home network and Aura accessories.
-   **Power System:** A main power supply for the rail and an inductive charging transmitter coil to wirelessly power the Aura Knife.
-   **Enclosure:** A custom-designed, sleek housing to be mounted on a kitchen backsplash.

### 2. Aura Knife (Onboard Food Analysis)
This diagnostic tool analyzes food composition in real-time as it cuts.

-   **Spectrometer:** A miniaturized near-infrared (NIR) spectrometer module suitable for embedding into a knife handle. This is the core component for chemical analysis of food.
-   **Microcontroller:** A low-power MCU (e.g., an ARM Cortex-M series) to process data from the spectrometer and communicate with the Aura Rail.
-   **Wireless Communication:** A Bluetooth Low Energy (BLE) module for transmitting data to the Aura Rail.
-   **Power System:** An inductive charging receiver coil and a small LiPo battery to power the electronics.
-   **Physical Assembly:** A custom-designed knife handle to safely house all electronic components, ensuring it remains balanced, ergonomic, and water-resistant.

### 3. SmartBite "Gecko" Sensors (Ambient Inventory Trackers)
These are thin, adhesive sensors for real-time, automated inventory management.

-   **Weight/Volume Sensors:**
    -   **For Liquids/Grains:** Flexible, printed load cells or capacitance sensor arrays that can be attached to the bottom or side of containers.
    -   **For Countable Items:** Small break-beam (IR emitter/detector pairs) or capacitive touch sensors to detect the presence or absence of items like cans or eggs.
-   **Environment Sensor:** A multi-sensor module (e.g., BME680) capable of detecting temperature, humidity, and volatile organic compounds (VOCs), which is crucial for detecting ethylene gas for freshness monitoring.
-   **Microcontroller & Wireless:** A low-power MCU with integrated BLE for each sensor unit.
-   **Power Source:** Energy harvesting modules (e.g., small solar cells designed for indoor light) or long-life coin cell batteries.
-   **Enclosure:** A thin, flexible, and food-safe silicone or polymer casing for the electronics.

## Conclusion

The SmartBite project successfully demonstrates the potential of leveraging generative AI to create a truly smart kitchen assistant. By integrating various AI capabilities—from vision and OCR to natural language processing and video generation—it provides a single, cohesive platform that addresses key user pain points in a novel way. The project meets all its stated objectives, delivering a feature-rich application that can help users save time, reduce food waste, and lead healthier lives. The use of Genkit for AI orchestration proved highly effective, allowing for the creation of complex, stateful AI agents with relative ease.

## Future Work / Scope

The SmartBite platform is a strong foundation that can be extended in several ways:
-   **Deeper Personalization:** Develop a "Flavor Genome" for each user based on their cooking history and transformed recipes, allowing for even more personalized suggestions.
-   **Integration with Grocery Delivery:** Connect the generated shopping list to online grocery services to automate purchasing.
-   **Smart Appliance Integration:** Allow the app to communicate with smart ovens or refrigerators to pre-heat or adjust settings based on the selected recipe.
-   **Long-Term Trend Analysis:** Expand the health and financial dashboards to show trends over months or years, providing more comprehensive insights.
-   **Advanced Waste Tracking:** Improve waste tracking by allowing users to specify the reason for waste (e.g., spoilage, leftovers), which can feed back into the AI's suggestions for better portion control or meal planning.
