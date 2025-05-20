import { getTasks } from "@/lib/actions/tasks";
import { PageHeader } from "@/components/page-header";
import { KanbanBoard } from "@/components/projects/kanban-board";

export const metadata = {
  title: "Kanban Board | Blurr HR Portal",
};

export default async function KanbanPage() {
  const tasks = await getTasks();

  return (
    <div className="container py-6">
      <PageHeader
        heading="Kanban Board"
        description="Manage your tasks with a visual board."
      />

      <div className="mt-6">
        <KanbanBoard tasks={tasks} />
      </div>
    </div>
  );
}
