using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.CreateInviteLink
{
    public class CreateInviteLinkCommandHandler
        : IRequestHandler<CreateInviteLinkCommand, CreateInviteLinkResult>
    {
        private const string Alphabet =
            "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        private readonly IServerRepository _serverRepository;
        private readonly IServerInviteLinkRepository _linkRepository;
        private readonly IUserContextService _userContext;

        public CreateInviteLinkCommandHandler(
            IServerRepository serverRepository,
            IServerInviteLinkRepository linkRepository,
            IUserContextService userContext)
        {
            _serverRepository = serverRepository;
            _linkRepository = linkRepository;
            _userContext = userContext;
        }

        public async Task<CreateInviteLinkResult> Handle(
            CreateInviteLinkCommand request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContext.GetCurrentUserId();
            var server = await _serverRepository.GetByIdAsync(request.ServerId)
                ?? throw new Exception("Sunucu bulunamadı.");

            if (!await _serverRepository.IsMemberAsync(request.ServerId, currentUserId))
            {
                throw new Exception("Bu sunucu için davet linki oluşturamazsınız.");
            }

            // Aynı sunucu için mevcut linki yeniden kullan (MVP: tek aktif link).
            var existing = await _linkRepository.GetLatestForServerAsync(request.ServerId);
            if (existing != null)
            {
                return new CreateInviteLinkResult
                {
                    Code = existing.Code,
                    ServerId = server.Id,
                    ServerName = server.Name
                };
            }

            string code;
            do
            {
                code = GenerateCode(8);
            } while (await _linkRepository.GetByCodeAsync(code) != null);

            var link = new ServerInviteLink
            {
                Id = Guid.NewGuid(),
                ServerId = request.ServerId,
                CreatedByUserId = currentUserId,
                Code = code,
                CreatedAt = DateTime.UtcNow,
                UseCount = 0
            };

            await _linkRepository.AddAsync(link);

            return new CreateInviteLinkResult
            {
                Code = link.Code,
                ServerId = server.Id,
                ServerName = server.Name
            };
        }

        private static string GenerateCode(int length)
        {
            var chars = new char[length];
            var bytes = RandomNumberGenerator.GetBytes(length);
            for (var i = 0; i < length; i++)
            {
                chars[i] = Alphabet[bytes[i] % Alphabet.Length];
            }
            return new string(chars);
        }
    }
}
