import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateUserDto,
  IdParamDto,
  InviteUserDto,
  ListInvitationsDto,
  ListUsersDto,
  UpdateUserDto,
} from '@domain/dtos/user';
import type { IUserAdapter } from '@infrastructure/external-services/clerk';

/**
 * Frontera HTTP de la gestión de usuarios: valida la entrada con los DTOs y
 * delega en el adapter de Clerk inyectado — la gestión de identidad es un
 * servicio externo sin lógica de negocio propia, así que no hay capa de
 * service.
 *
 * @remarks
 * Handlers como propiedades arrow para conservar `this` al registrarlos en
 * las rutas. El adapter traduce los errores del proveedor y la cadena global
 * los resuelve; aquí no se capturan.
 */
export class UsersController {
  public constructor(private readonly users: IUserAdapter) {}

  public readonly list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = ListUsersDto.fromRequest(request.query);
    const page = await this.users.listUsers(dto);
    await reply.send({ data: page.data.map(user => user.toEntity()), totalCount: page.totalCount });
  };

  public readonly count = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = ListUsersDto.fromRequest(request.query);
    const totalCount = await this.users.countUsers(dto.query);
    await reply.send({ totalCount });
  };

  public readonly get = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = IdParamDto.fromRequest(request.params);
    const user = await this.users.getUser(id);
    await reply.send(user.toEntity());
  };

  public readonly create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = CreateUserDto.fromRequest(request.body);
    const user = await this.users.createUser(dto);
    await reply.code(201).send(user.toEntity());
  };

  public readonly update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = IdParamDto.fromRequest(request.params);
    const dto = UpdateUserDto.fromRequest(request.body);
    const user = await this.users.updateUser(id, dto);
    await reply.send(user.toEntity());
  };

  public readonly remove = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = IdParamDto.fromRequest(request.params);
    await this.users.deleteUser(id);
    await reply.code(204).send();
  };

  public readonly listInvitations = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = ListInvitationsDto.fromRequest(request.query);
    const page = await this.users.listInvitations(dto);
    await reply.send({
      data: page.data.map(invitation => invitation.toEntity()),
      totalCount: page.totalCount,
    });
  };

  public readonly invite = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = InviteUserDto.fromRequest(request.body);
    const invitation = await this.users.createInvitation(dto);
    await reply.code(201).send(invitation.toEntity());
  };

  public readonly revokeInvitation = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = IdParamDto.fromRequest(request.params);
    const invitation = await this.users.revokeInvitation(id);
    await reply.send(invitation.toEntity());
  };
}
