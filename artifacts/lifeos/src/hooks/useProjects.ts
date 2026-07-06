import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { useListProjects, useGetProject, useCreateProject, useUpdateProject, useDeleteProject, getListProjectsQueryKey, getGetProjectQueryKey } from "@workspace/api-client-react";

const projectSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  notes: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(['Not Started', 'In Progress', 'Done', 'On Hold']).default('Not Started'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  sprint: z.string().trim().max(50).optional().nullable(),
  hubId: z.number().int().positive().optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export type ProjectInsert = z.infer<typeof projectSchema>;

export const useProjects = (filters?: { status?: string; hubId?: number }) => {
  return useListProjects();
};

export const useProject = (id: number) => {
  return useGetProject(id as any);
};

export const useCreateProjectHook = () => {
  const queryClient = useQueryClient();
  const createProject = useCreateProject();

  return {
    ...createProject,
    mutate: (projectData: ProjectInsert) => {
      const validated = projectSchema.parse(projectData);
      return createProject.mutate({
        data: validated as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast.success('Project created successfully');
        },
        onError: (error: any) => {
          console.error('Create project error:', error);
          toast.error(error.message || 'Failed to create project');
        },
      });
    }
  };
};

export const useUpdateProjectHook = () => {
  const queryClient = useQueryClient();
  const updateProject = useUpdateProject();

  return {
    ...updateProject,
    mutate: ({ id, ...updates }: Partial<ProjectInsert> & { id: number }) => {
      return updateProject.mutate({
        id,
        data: updates as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id as any) });
          toast.success('Project updated');
        },
        onError: () => {
          toast.error('Failed to update project');
        },
      });
    }
  };
};

export const useDeleteProjectHook = () => {
  const queryClient = useQueryClient();
  const deleteProject = useDeleteProject();

  return {
    ...deleteProject,
    mutate: (id: number) => {
      return deleteProject.mutate({ id } as any, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast.success('Project deleted');
        },
        onError: () => {
          toast.error('Failed to delete project');
        },
      });
    }
  };
};

