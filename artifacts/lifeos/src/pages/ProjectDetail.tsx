import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useGetProject, useUpdateProject, useListTasks, useUpdateTask, getGetProjectQueryKey, getListTasksQueryKey } from "@workspace/api-client-react";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  CheckCircle2,
  Circle,
  Calendar,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId!);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useGetProject(id as any);

  useEffect(() => {
    if (project?.notes) {
      setNotes(project.notes);
    }
  }, [project]);

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useListTasks(id as any);

  // Update project notes
  const updateProjectMutation = useUpdateProject();
  const [editingNotes, setEditingNotes] = useState(false);
  const updateNotes = {
    mutate: (newNotes: string) => {
      updateProjectMutation.mutate({
        id: id as any,
        data: { notes: newNotes }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id as any) });
          toast.success('Notes updated');
          setEditingNotes(false);
        }
      });
    },
    isPending: updateProjectMutation.isPending
  };


  // Toggle task status
  const updateTaskMutation = useUpdateTask();
  const toggleTask = {
    mutate: ({ taskId, currentStatus }: { taskId: number; currentStatus: string }) => {
      const newStatus = currentStatus === 'Done' ? 'Not Started' : 'Done';
      updateTaskMutation.mutate({
        id: taskId as any,
        data: { status: newStatus as any }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(id as any) });
        }
      });
    },
    isPending: updateTaskMutation.isPending
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested project doesn't exist.</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const completedTasks = tasks?.filter(t => t.status === 'Done').length || 0;
  const totalTasks = tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getStatusColor(project.status!)}>
                {project.status}
              </Badge>
              <Badge variant="outline" className={getStatusColor(project.priority!)}>
                {project.priority} Priority
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate('/projects')}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Project
        </Button>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </span>
            <span className="text-2xl font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
            {project.dueDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Due: {format(new Date(project.dueDate), 'MMM d, yyyy')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Manage project tasks and track progress</CardDescription>
          </div>
          <Button onClick={() => navigate('/projects')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <button
                    onClick={() => toggleTask.mutate({ taskId: task.id, currentStatus: task.status ?? 'Not Started' })}
                    className="mt-1"
                  >
                    {task.status === 'Done' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <Flag className={`h-3 w-3 ${getPriorityColor(task.priority ?? 'Medium')}`} />
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={getStatusColor(task.status ?? 'Not Started')}>
                        {task.status}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due: {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No tasks yet</p>
              <Button variant="outline" onClick={() => navigate('/projects')}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notes</CardTitle>
          {!editingNotes && (
            <Button variant="outline" size="sm" onClick={() => setEditingNotes(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingNotes ? (
            <div className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this project..."
                rows={6}
              />
              <div className="flex gap-2">
                <Button onClick={() => updateNotes.mutate(notes)}>
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNotes(project.notes || '');
                    setEditingNotes(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {project.notes || 'No notes yet. Click Edit to add notes.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
