
### System Methodology

The methodology for developing the SmartBite prototype was structured into several key stages: system architecture design, AI flow and tool implementation, client-server integration, and a framework for functional evaluation.

#### 1. System Architecture Design

The system was designed using a three-tier architecture to ensure a clear separation of concerns, scalability, and maintainability. This architecture, as illustrated in the figure below, consists of a client-side layer, a server-side orchestration layer, and external backend services.

```mermaid
graph TD
    subgraph "Client-Side (Browser)"
        A[Next.js Frontend - React Components]
    end

    subgraph "Server-Side (Next.js & Genkit)"
        B[Genkit AI Flows <br/> e.g., recommendRecipes, scanReceipt]
        C[Genkit Tools <br/> e.g., checkInventory]
        D[Firebase SDK]
    end

    subgraph "External Services"
        E[Firebase <br/> (Auth, Firestore)]
        F[Google AI <br/> (Gemini & Veo Models)]
    end

    A -- "Server Action Call" --> B
    B -- "Uses Tool" --> C
    C -- "Queries/Mutates Data" --> D
    D -- "Interacts with" --> E
    B -- "Calls Generative Model" --> F
    A -- "Reads Data via Firebase SDK" --> E
```
*Figure 1: SmartBite System Architecture*

-   **Client-Side Layer:** A responsive user interface was built using Next.js with the App Router, React, and ShadCN UI components. This layer handles user interaction and renders data.
-   **Server-Side Layer:** All AI logic was encapsulated within a Next.js server environment and orchestrated using **Genkit**. This layer defines the core intelligence of the application.
-   **External Services Layer:** Firebase (Firestore and Auth) was used for data persistence and user management, while Google AI (Gemini and Veo models) provided the core generative capabilities.

#### 2. AI Implementation as Flows and Tools

The core logic of the system was implemented not as monolithic services, but as a series of distinct, manageable **AI Flows** using Genkit. Each flow represents a specific task (e.g., `scanReceipt`, `recommendRecipes`). To enable these flows to interact with real-time data, **Tools** were developed. For instance, the `checkInventoryTool` provides the AI with a secure and structured function to query the Firestore database, allowing its generative outputs to be grounded in the user's actual inventory. This modular, tool-based approach is central to the system's methodology.

#### 3. Client-Server Integration

Communication between the client-side React components and the server-side Genkit flows was implemented using **Next.js Server Actions**. This remote procedure call (RPC) mechanism allows the frontend to securely invoke server-side AI logic without exposing API endpoints, streamlining the development process and enhancing security. For asynchronous tasks like multimedia generation, flows were designed to be non-blocking, preventing the UI from freezing during long-running operations.

#### 4. Evaluation Framework

While this paper presents a functional prototype, a framework for its quantitative and qualitative evaluation was established. Key metrics for future testing would include:

-   **OCR Accuracy:** Measured by the character error rate (CER) of the `scanReceipt` flow against a dataset of receipt images.
-   **Recipe Relevance:** Evaluated through user satisfaction surveys (e.g., Likert scale ratings) on the quality and relevance of recommendations from the `recommendRecipes` flow.
-   **Task Completion Time:** Time-on-task analysis for key user journeys, such as adding inventory and generating a meal plan.
-   **Waste Reduction:** A longitudinal study tracking the percentage of items marked as 'wasted' over time compared to a baseline.

