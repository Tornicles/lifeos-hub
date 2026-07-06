import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useListCouples,
  useCreateCouple,
  getListCouplesQueryKey,
  useCreatePartnerLink,
  useAcceptPartnerLink,
  useListCoupleDiscussionPrompts,
  type PartnerLinkInput,
} from '@workspace/api-client-react';

export const useCouples = () => useListCouples();

export const useCreateCoupleHook = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateCouple();
  return {
    ...mutation,
    mutate: () =>
      mutation.mutate(
        undefined as unknown as void,
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCouplesQueryKey() });
            toast.success('Couple created');
          },
          onError: (error: any) => {
            console.error('Create couple error:', error);
            toast.error(error?.message || 'Failed to create couple');
          },
        },
      ),
  };
};

export const useInvitePartner = () => {
  const mutation = useCreatePartnerLink();
  return {
    ...mutation,
    mutate: (
      { coupleId, ...data }: PartnerLinkInput & { coupleId: string },
      opts?: { onSuccess?: (inviteCode: string) => void },
    ) =>
      mutation.mutate(
        { id: coupleId, data },
        {
          onSuccess: (result: any) => {
            toast.success('Invite link created');
            opts?.onSuccess?.(result.inviteCode);
          },
          onError: (error: any) => {
            console.error('Create partner link error:', error);
            toast.error(error?.message || 'Failed to create invite link');
          },
        },
      ),
  };
};

export const useAcceptInvite = () => {
  const queryClient = useQueryClient();
  const mutation = useAcceptPartnerLink();
  return {
    ...mutation,
    mutate: (code: string) =>
      mutation.mutate(
        { code },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCouplesQueryKey() });
            toast.success('You are now linked as partners!');
          },
          onError: (error: any) => {
            console.error('Accept invite error:', error);
            toast.error(error?.message || 'Invite link not found or already used');
          },
        },
      ),
  };
};

export const useCoupleDiscussionPrompts = () => useListCoupleDiscussionPrompts();
