import type {
  CreateBusinessApplicationInput,
  ReviewBusinessApplicationInput,
  UpdateBusinessInput,
  InviteBusinessUserInput,
  ResendInviteInput,
  RevokeInviteInput,
  AssignBusinessUserInput,
  ChangeClientRoleInput,
} from '@/types/services';
import type {
  BusinessApplicationResponse,
  MyBusinessesResponse,
  AllBusinessesResponse,
  BusinessDetailResponse,
  BusinessApplicationsListResponse,
  ReviewApplicationResponse,
  AssignUserResponse,
  GetBusinessClientsResponse,
  ChangeClientRoleResponse,
  BusinessInviteResponseDto,
  BusinessInvitesListResponse,
  BusinessMessageResponse,
  RevokeInviteResponse,
  TenantMetadataResponse,
  BusinessStatisticsResponse,
  ClientPodiumResponse,
  GetOtherBusinessesResponse,
} from '@/types/services';
import {
  ApiError,
  createAuthenticatedClient,
  safeParseJson,
  API_CONFIG,
  type HTTPErrorLike,
} from '@/lib/requests';

export const BusinessService = {
  async applyForBusiness(
    data: CreateBusinessApplicationInput
  ): Promise<BusinessApplicationResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .post(API_CONFIG.BUSINESS.APPLY, { json: data })
        .json<BusinessApplicationResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getApplications(): Promise<BusinessApplicationsListResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.BUSINESS.APPLICATIONS)
        .json<BusinessApplicationsListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async reviewApplication(
    id: string,
    data: ReviewBusinessApplicationInput
  ): Promise<ReviewApplicationResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.REVIEW_APPLICATION.replace(
        '{id}',
        id
      );
      const result = await client
        .post(endpoint, {
          json: data,
        })
        .json<ReviewApplicationResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getMyBusinesses(): Promise<MyBusinessesResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.BUSINESS.MY_BUSINESSES)
        .json<MyBusinessesResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getAllBusinesses(): Promise<AllBusinessesResponse> {
    const client = createAuthenticatedClient();
    try {
      const result = await client
        .get(API_CONFIG.BUSINESS.ALL_BUSINESSES)
        .json<AllBusinessesResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getBusinessById(
    id: string,
    businessId: string
  ): Promise<BusinessDetailResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_BUSINESS.replace('{id}', id);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<BusinessDetailResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async updateBusiness(
    id: string,
    data: UpdateBusinessInput
  ): Promise<BusinessDetailResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.UPDATE_BUSINESS.replace('{id}', id);
      const payload = {
        ...(data as UpdateBusinessInput),
        businessId: id,
      };
      const result = await client
        .put(endpoint, { json: payload })
        .json<BusinessDetailResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async deleteBusiness(id: string): Promise<BusinessMessageResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.DELETE_BUSINESS.replace('{id}', id);
      const result = await client
        .delete(endpoint, { json: { businessId: id } })
        .json<BusinessMessageResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async assignUser(
    businessId: string,
    data: AssignBusinessUserInput
  ): Promise<AssignUserResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.ASSIGN_USER.replace(
        '{id}',
        businessId
      );
      const payload = {
        ...(data as AssignBusinessUserInput),
        businessId,
      };
      const result = await client
        .post(endpoint, { json: payload })
        .json<AssignUserResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async unassignUser(
    businessId: string,
    userId: string
  ): Promise<BusinessMessageResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.UNASSIGN_USER.replace(
        '{id}',
        businessId
      ).replace('{userId}', userId);
      const result = await client
        .delete(endpoint, { json: { businessId } })
        .json<BusinessMessageResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getTenantMetadata(
    id: string,
    businessId: string
  ): Promise<TenantMetadataResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.TENANT_METADATA.replace('{id}', id);
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<TenantMetadataResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getBusinessClients(
    businessId: string
  ): Promise<GetBusinessClientsResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_CLIENTS;
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<GetBusinessClientsResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getOtherBusinesses(): Promise<GetOtherBusinessesResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_OTHER_BUSINESSES;
      const result = await client
        .get(endpoint)
        .json<GetOtherBusinessesResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async changeClientRole(
    businessId: string,
    clientId: string,
    data: ChangeClientRoleInput
  ): Promise<ChangeClientRoleResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.CHANGE_CLIENT_ROLE.replace(
        '{id}',
        businessId
      ).replace('{clientId}', clientId);
      const normalizedRole =
        'role' in data
          ? data.role
          : 'newRole' in data
            ? data.newRole
            : undefined;
      if (!normalizedRole || normalizedRole.trim() === '') {
        throw new Error('Invalid role: role is required');
      }
      const payload = {
        businessId,
        role: normalizedRole,
      };
      const result = await client
        .patch(endpoint, { json: payload })
        .json<ChangeClientRoleResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async deleteClient(
    businessId: string,
    clientId: string
  ): Promise<BusinessMessageResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.DELETE_CLIENT.replace(
        '{id}',
        businessId
      ).replace('{clientId}', clientId);
      const result = await client
        .delete(endpoint, { json: { businessId } })
        .json<BusinessMessageResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getBusinessStatistics(
    businessId: string,
    predictionHorizonDays?: number
  ): Promise<BusinessStatisticsResponse> {
    if (
      !businessId ||
      typeof businessId !== 'string' ||
      businessId.trim() === ''
    ) {
      throw new Error('Invalid businessId: must be a non-empty string');
    }
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_STATISTICS;
      const body: Record<string, number> = {};
      if (predictionHorizonDays !== undefined) {
        body.predictionHorizonDays = predictionHorizonDays;
      }
      const result = await client
        .post(endpoint, {
          searchParams: { businessId },
          json: body,
        })
        .json<BusinessStatisticsResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getClientPodium(businessId: string): Promise<ClientPodiumResponse> {
    // Validate businessId before constructing endpoint
    if (
      !businessId ||
      typeof businessId !== 'string' ||
      businessId.trim() === ''
    ) {
      throw new Error('Invalid businessId: must be a non-empty string');
    }
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_CLIENT_PODIUM;
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<ClientPodiumResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async inviteBusinessUser(
    businessId: string,
    data: InviteBusinessUserInput
  ): Promise<BusinessInviteResponseDto> {
    if (
      !businessId ||
      typeof businessId !== 'string' ||
      businessId.trim() === ''
    ) {
      throw new Error('Invalid businessId: must be a non-empty string');
    }
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.INVITE_USER;
      const payload = {
        ...data,
        businessId,
      };
      const result = await client
        .post(endpoint, { json: payload })
        .json<BusinessInviteResponseDto>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async getBusinessInvites(
    businessId: string
  ): Promise<BusinessInvitesListResponse> {
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.GET_PENDING_INVITES;
      const searchParams: Record<string, string> = { businessId };
      const result = await client
        .get(endpoint, { searchParams })
        .json<BusinessInvitesListResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  async resendInvite(
    data: ResendInviteInput
  ): Promise<BusinessInviteResponseDto> {
    if (!data.businessId || data.businessId.trim() === '') {
      throw new Error('Invalid businessId: must be a non-empty string');
    }
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.RESEND_INVITE;
      const result = await client
        .post(endpoint, { json: data })
        .json<BusinessInviteResponseDto>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },

  /**
   * Revoke a pending invitation.
   * DELETE /business/invites/:inviteId?businessId=<businessId>
   */
  async revokeInvite(
    inviteId: string,
    data: RevokeInviteInput
  ): Promise<RevokeInviteResponse> {
    if (!inviteId || typeof inviteId !== 'string' || inviteId.trim() === '') {
      throw new Error('Invalid inviteId: must be a non-empty string');
    }
    const client = createAuthenticatedClient();
    try {
      const endpoint = API_CONFIG.BUSINESS.REVOKE_INVITE.replace(
        '{inviteId}',
        inviteId
      );
      const searchParams: Record<string, string> = {
        businessId: data.businessId,
      };
      const result = await client
        .delete(endpoint, { searchParams })
        .json<RevokeInviteResponse>();
      return result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = await safeParseJson(
          (error as HTTPErrorLike).response
        );
        throw ApiError.fromResponse(errorData);
      }
      throw error;
    }
  },
};
