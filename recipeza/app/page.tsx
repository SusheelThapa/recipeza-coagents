"use client";

import { RecipezaWrapper } from "@/components/RecipezaWrapper";
import { RecipezaProvider } from "@/lib/recipeza-provider";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between">
      <CopilotKit runtimeUrl="/api/copilotkit" agent="recipe_agent">
        <RecipezaProvider>
          <RecipezaWrapper />
        </RecipezaProvider>
      </CopilotKit>
    </main>
  );
}
