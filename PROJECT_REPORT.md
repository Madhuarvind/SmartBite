# SmartBite Project Report

## Introduction

### Brief background of the problem

In an era of growing environmental consciousness, the modern household faces a significant sustainability challenge: food waste. A substantial portion of global food production is lost or wasted at the consumer level, contributing to unnecessary greenhouse gas emissions, wasted water, and significant economic loss. This issue stems from several interconnected problems:
- **Food Waste:** Ingredients are often over-purchased, forgotten in the back of the refrigerator, or mismanaged, leading to spoilage. This has a direct and measurable negative impact on the environment and household budgets.
- **Unsustainable Consumption Habits:** Without clear insight into the environmental impact of their choices, consumers often unknowingly purchase foods with high carbon footprints, contributing to broader ecological strain.
- **Decision Fatigue and Inefficiency:** The daily cognitive load of meal planning often leads to inefficient use of available ingredients, resulting in repetitive meals and a reactive approach to grocery shopping, which perpetuates the cycle of waste.

### Why this project is important

The SmartBite project is important because it provides a tangible, technology-driven solution to these pressing sustainability challenges. By creating an intelligent, closed-loop system for kitchen management, SmartBite empowers users to transition from a pattern of unconscious consumption to a more mindful, sustainable lifestyle. It is not just an app for convenience; it is a tool designed to directly reduce food waste, promote environmentally-conscious purchasing decisions, and help users live healthier, more sustainable lives.

## Problem Statement

The core challenge this project addresses is the environmental and economic unsustainability of traditional home kitchen management. Households lack a centralized system that connects their food inventory with meal planning in a way that prioritizes waste reduction and sustainable consumption. This disconnect leads to significant food and financial waste, a lack of awareness about the environmental impact of grocery choices, and the daily stress of inefficient meal preparation. This project tackles the specific problem of leveraging modern AI to create a proactive, sustainable kitchen assistant that transforms a wasteful routine into an intelligent and eco-friendly process.

## Objectives

The primary objectives of the SmartBite project are to:

1.  **Develop an Intelligent Inventory System to Minimize Food Waste:** Create a system that automatically digitizes groceries and predicts expiry dates, providing users with the tools to significantly reduce the amount of food that is thrown away.
2.  **Implement AI-Powered Recipe Generation for Sustainable Cooking:** Build AI agents that recommend recipes based on ingredients already in the pantry, with a priority on using items before they expire.
3.  **Provide Comprehensive Sustainability Coaching:** Create AI flows that analyze user purchasing habits to provide actionable insights on nutritional intake, budget optimization, and, crucially, their environmental carbon footprint.
4.  **Promote Conscious Consumption through Education and Gamification:** Design an engaging user experience that tracks positive environmental impact (e.g., food saved, CO2 reduced) and rewards sustainable behavior with badges and milestones.
5.  **Build a Seamless and Intuitive User Experience:** Design a user-friendly interface using a modern web stack (Next.js, Tailwind CSS) that makes sustainable living easy and accessible.
6.  **Create a Smart, Collaborative Shopping Experience:** Develop tools that prevent duplicate purchases and provide on-the-go assistance to help users make more sustainable choices in the grocery store.

## Literature Review / Related Work

While numerous recipe apps (e.g., Allrecipes, Yummly) and grocery list apps (e.g., AnyList) exist, they typically operate in silos. Recipe apps suggest meals without knowing the user's actual inventory, and grocery apps help with shopping but don't assist in using the items purchased.

Some existing solutions have attempted to bridge this gap:
- **SuperCook:** Recommends recipes based on user-inputted ingredients. Its limitation lies in the manual and tedious nature of inventory management.
- **Mealime:** Excels at meal planning and generating shopping lists but lacks dynamic inventory tracking and cannot adapt suggestions if the user cooks something off-plan or buys extra items.
- **MyFitnessPal:** Focuses heavily on calorie and nutrient tracking but does not connect this data back to inventory management or predictive recipe suggestions.

SmartBite's novelty lies in its comprehensive integration and focus on sustainability. It uses multimodal AI to automate inventory input, generative AI to create a dynamic and personalized cooking experience, and analytical AI to provide sustainability coaching. It closes the loop from shopping to eating to analysis, a feature largely absent in existing solutions.

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

**Prototype Budget Estimate (Aura Rail):**
- Raspberry Pi 4 (4GB): **$55 - $75**
- Pico-projector: **$100 - $300**
- ToF Gesture Sensor: **$15 - $30**
- 5V Power Supply: **$10 - $20**
- Inductive Charging Transmitter: **$15 - $25**
- 3D Printed/Custom Enclosure: **$30 - $100**
- **Subtotal: ~$225 - $550**

### 2. Aura Knife (Onboard Food Analysis)
This diagnostic tool analyzes food composition in real-time as it cuts.

-   **Spectrometer:** A miniaturized near-infrared (NIR) spectrometer module suitable for embedding into a knife handle. This is the core component for chemical analysis of food.
-   **Microcontroller:** A low-power MCU (e.g., an ARM Cortex-M series) to process data from the spectrometer and communicate with the Aura Rail.
-   **Wireless Communication:** A Bluetooth Low Energy (BLE) module for transmitting data to the Aura Rail.
-   **Power System:** An inductive charging receiver coil and a small LiPo battery to power the electronics.
-   **Physical Assembly:** A custom-designed knife handle to safely house all electronic components, ensuring it remains balanced, ergonomic, and water-resistant.

**Prototype Budget Estimate (Aura Knife):**
- Miniaturized NIR Spectrometer (e.g., from Hamamatsu or similar): **$500 - $2,500+** (This is the most significant cost driver)
- Low-power MCU (e.g., Seeed Studio XIAO, ESP32-C3): **$5 - $15**
- BLE Module: **$5 - $10**
- Inductive Charging Receiver & Battery: **$10 - $20**
- Custom Handle/Enclosure: **$50 - $150**
- **Subtotal: ~$570 - $2,700+**

### 3. SmartBite "Gecko" Sensors (Ambient Inventory Trackers)
These are thin, adhesive sensors for real-time, automated inventory management.

-   **Weight/Volume Sensors:**
    -   **For Liquids/Grains:** Flexible, printed load cells or capacitance sensor arrays that can be attached to the bottom or side of containers.
    -   **For Countable Items:** Small break-beam (IR emitter/detector pairs) or capacitive touch sensors to detect the presence or absence of items like cans or eggs.
-   **Environment Sensor:** A multi-sensor module (e.g., BME680) capable of detecting temperature, humidity, and volatile organic compounds (VOCs), which is crucial for detecting ethylene gas for freshness monitoring.
-   **Microcontroller & Wireless:** A low-power MCU with integrated BLE for each sensor unit.
-   **Power Source:** Energy harvesting modules (e.g., small solar cells designed for indoor light) or long-life coin cell batteries.
-   **Enclosure:** A thin, flexible, and food-safe silicone or polymer casing for the electronics.

**Prototype Budget Estimate (per Gecko Sensor):**
- Load Cell/Capacitance Array: **$10 - $25**
- IR Break-beam Sensor: **$2 - $5**
- BME680 Environment Sensor: **$10 - $15**
- Low-power MCU with BLE (e.g., nRF52 series): **$8 - $20**
- Power Source (Coin Cell or Solar): **$2 - $10**
- **Subtotal per sensor: ~$25 - $75**

## Conclusion

The SmartBite project successfully demonstrates the potential of leveraging generative AI to create a truly smart kitchen assistant. By integrating various AI capabilities—from vision and OCR to natural language processing and video generation—it provides a single, cohesive platform that addresses key user pain points in a novel way. The project meets all its stated objectives, delivering a feature-rich application that can help users save time, reduce food waste, and lead healthier lives. The use of Genkit for AI orchestration proved highly effective, allowing for the creation of complex, stateful AI agents with relative ease.

## Future Work / Scope

The SmartBite platform is a strong foundation that can be extended in several ways:
-   **Deeper Personalization:** Develop a "Flavor Genome" for each user based on their cooking history and transformed recipes, allowing for even more personalized suggestions.
-   **Integration with Grocery Delivery:** Connect the generated shopping list to online grocery services to automate purchasing.
-   **Smart Appliance Integration:** Allow the app to communicate with smart ovens or refrigerators to pre-heat or adjust settings based on the selected recipe.
-   **Long-Term Trend Analysis:** Expand the health and financial dashboards to show trends over months or years, providing more comprehensive insights.
-   **Advanced Waste Tracking:** Improve waste tracking by allowing users to specify the reason for waste (e.g., spoilage, leftovers), which can feed back into the AI's suggestions for better portion control or meal planning.
