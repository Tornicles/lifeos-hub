import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, Flag, Clock } from "lucide-react";

export default function Projects() {
  const [view, setView] = useState<'board' | 'list'>('board');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('projects')
        .select('*, tasks(*), hubs(name, code)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Not Started': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  const projectsByStatus = {
    'Not Started': projects?.filter(p => p.status === 'Not Started') || [],
    'In Progress': projects?.filter(p => p.status === 'In Progress') || [],
    'Done': projects?.filter(p => p.status === 'Done') || [],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground text-lg">
            Scrum-style project management
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'board' | 'list')}>
        <TabsList>
          <TabsTrigger value="board">Board View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-6 mt-6">
          {/* Kanban Board */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {Object.entries(projectsByStatus).map(([status, statusProjects]) => (
                <div key={status} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(status)}`} />
                      {status}
                    </h3>
                    <Badge variant="secondary">{statusProjects.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {statusProjects.map((project) => (
                      <Card 
                        key={project.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base line-clamp-2">
                              {project.title}
                            </CardTitle>
                            <Badge variant={getPriorityColor(project.priority || 'Medium')}>
                              <Flag className="h-3 w-3 mr-1" />
                              {project.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {project.hubs && (
                            <Badge variant="outline" className="text-xs">
                              {project.hubs.name}
                            </Badge>
                          )}
                          
                          {project.due_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.due_date).toLocaleDateString()}
                            </div>
                          )}

                          {project.tasks && project.tasks.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {project.tasks.filter((t: any) => t.status === 'Done').length}
                              </span>
                              <span className="text-muted-foreground">
                                / {project.tasks.length} tasks
                              </span>
                            </div>
                          )}

                          {project.sprint && (
                            <Badge variant="secondary" className="text-xs">
                              Sprint: {project.sprint}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {statusProjects.length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                          <p className="text-sm text-muted-foreground">
                            No projects in {status.toLowerCase()}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {/* List View */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {projects?.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`h-12 w-1 rounded-full ${getStatusColor(project.status || 'Not Started')}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {project.hubs && (
                            <Badge variant="outline">{project.hubs.name}</Badge>
                          )}
                          {project.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(project.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {project.tasks && project.tasks.length > 0 && (
                            <span>
                              {project.tasks.filter((t: any) => t.status === 'Done').length} / {project.tasks.length} tasks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getPriorityColor(project.priority || 'Medium')}>
                        {project.priority}
                      </Badge>
                      <Badge variant="secondary">{project.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {projects?.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first project to start tracking tasks
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
