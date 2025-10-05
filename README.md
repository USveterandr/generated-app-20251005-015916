# BudgetWise AI
An elegant and minimalist expense tracking app with gamification features to promote financial wellness.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/USveterandr/budget-wise-cloudflare)
BudgetWise AI is an elegant, minimalist personal finance application designed to make expense tracking and budget management an intuitive and engaging experience. Built on a robust serverless architecture using Cloudflare Workers, it prioritizes performance, security, and a stunning user interface. The application's core philosophy is 'less is more,' focusing on clarity and usability. It features a gamified system with achievements and streaks to encourage daily engagement. Users can log expenses, categorize them, set monthly budget limits, and visualize their financial health on a clean, modern dashboard.
## Key Features
-   **Minimalist Dashboard**: A clean, high-level overview of your financial status, including spending summaries, budget progress, and gamification stats.
-   **Expense Tracking**: Easily log and categorize your daily expenses through a quick-access dialog.
-   **Budget Management**: Set spending limits for different categories and track your progress in real-time.
-   **Investment Tracking**: Log and monitor your investment portfolio across various asset classes.
-   **Goal Setting**: Define and track your financial goals, from saving for a vacation to building an emergency fund.
-   **Gamification**: Stay motivated with achievements, streaks, and points for consistent financial tracking.
-   **AI Assistant**: Get financial insights and answers to your spending questions through a conversational AI.
-   **PWA Ready**: Installable on your mobile device for a near-native app experience.
-   **Blazing Fast & Secure**: Built on Cloudflare's serverless platform for optimal performance and security.
## Technology Stack
-   **Frontend**: React, Vite, React Router, Tailwind CSS
-   **UI Components**: shadcn/ui, Framer Motion, Lucide React, Recharts
-   **State Management**: Zustand (for client-side state), TanStack Query (for server state)
-   **Backend**: Cloudflare Workers, Hono
-   **Storage**: Cloudflare Durable Objects
-   **Language**: TypeScript
## Getting Started
Follow these instructions to get the project up and running on your local machine for development and testing purposes.
### Prerequisites
-   [Node.js](https://nodejs.org/) (v20.x or later)
-   [Bun](https://bun.sh/) package manager
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) logged into your Cloudflare account.
### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/USveterandr/budget-wise-cloudflare.git
    cd budget-wise-cloudflare
    ```
2.  **Install dependencies:**
    This project uses Bun for package management.
    ```bash
    bun install
    ```
3.  **Run the development server:**
    This command starts the Vite frontend development server and the local Wrangler server for the backend worker.
    ```bash
    bun run dev
    ```
The application will be available at `http://localhost:3000`.
## Project Structure
-   `src/`: Contains the React frontend application code.
    -   `pages/`: Top-level page components (Dashboard, Budgets, etc.).
    -   `components/`: Reusable UI components, including shadcn/ui.
    -   `lib/`: Utility functions, constants, and API client.
    -   `hooks/`: Custom React hooks.
-   `worker/`: Contains the Cloudflare Worker backend code.
    -   `index.ts`: The main entry point for the worker.
    -   `user-routes.ts`: **API routes are defined here.**
    -   `entities.ts`: **Data models (entities) for Durable Objects are defined here.**
    -   `core-utils.ts`: Core utilities for the Durable Object pattern (Do not modify).
-   `shared/`: Contains TypeScript types and constants shared between the frontend and backend.
## Development
### Adding API Endpoints
To add a new API endpoint, open `worker/user-routes.ts` and define a new route using the Hono router syntax. Use the entity helpers from `worker/entities.ts` to interact with data.
### Adding Data Models
To create a new data model (e.g., for a new feature), define a new class in `worker/entities.ts` that extends `IndexedEntity`.
### Shared Types
Always define data structures that are sent between the frontend and backend in `shared/types.ts` to ensure type safety across the application.
## Available Scripts
-   `bun run dev`: Starts the local development server for both frontend and backend.
-   `bun run build`: Builds the frontend application for production.
-   `bun run deploy`: Deploys the application to your Cloudflare account.
-   `bun run lint`: Lints the codebase to check for errors.
## Deployment
This project is designed for seamless deployment to Cloudflare.
1.  **Build the application:**
    ```bash
    bun run build
    ```
2.  **Deploy using Wrangler:**
    Make sure you are logged in to your Cloudflare account via the Wrangler CLI.
    ```bash
    bun run deploy
    ```
This command will build the application and deploy the static assets and the worker function to Cloudflare.
---
Built with ❤️ at Cloudflare