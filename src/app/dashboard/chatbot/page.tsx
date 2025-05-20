import { Metadata } from "next";
import { ChatInterface } from "@/components/chatbot/ChatInterface";

export const metadata: Metadata = {
  title: "Chatbot | Blurr HR Portal",
  description: "Ask questions about your projects and tasks",
};

export default async function ChatbotPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Blurr Assistant</h1>
        <p className="text-muted-foreground">Ask questions about your projects, tasks, and employees</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChatInterface />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Example Questions</h2>
            <ul className="space-y-3 text-sm">
              <li>• &quot;What are my tasks today?&quot;</li>
              <li>• &quot;Show me tasks in progress&quot;</li>
              <li>• &quot;What&apos;s the status of Project Apollo?&quot;</li>
              <li>• &quot;Show me tasks assigned to [employee name]&quot;</li>
              <li>• &quot;How many tasks are in progress?&quot;</li>
              <li>• &quot;Show me my project statistics&quot;</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
