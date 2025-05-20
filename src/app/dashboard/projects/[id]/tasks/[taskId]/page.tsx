import { redirect } from "next/navigation";

interface TaskPageProps {
  params: {
    id: string;
    taskId: string;
  };
}

export default function TaskPage({ params }: TaskPageProps) {
  // Simply redirect to the edit page for now
  redirect(`/dashboard/projects/${params.id}/tasks/${params.taskId}/edit`);
}
