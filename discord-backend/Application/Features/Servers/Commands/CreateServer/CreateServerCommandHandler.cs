using Application.Features.Servers.Queries.GetServers;
using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.CreateServer
{
    public class CreateServerCommandHandler : IRequestHandler<CreateServerCommand, ServerDto>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public CreateServerCommandHandler(
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<ServerDto> Handle(CreateServerCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new Exception("Sunucu adı boş olamaz.");
            }

            var ownerId = _userContextService.GetCurrentUserId();
            var iconUrl = string.IsNullOrWhiteSpace(request.IconUrl)
                ? null
                : request.IconUrl.Trim();

            var server = new Server
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                IconUrl = iconUrl,
                OwnerId = ownerId,
                CreatedAt = DateTime.UtcNow
            };

            var channels = ChannelsForTemplate(request.Template);
            await _serverRepository.CreateWithOwnerAsync(server, ownerId, channels);

            return new ServerDto
            {
                Id = server.Id,
                Name = server.Name,
                IconUrl = server.IconUrl
            };
        }

        private static IReadOnlyList<(string Name, string Type)> ChannelsForTemplate(string? template)
        {
            var key = (template ?? "custom").Trim().ToLowerInvariant();
            return key switch
            {
                "gaming" => new List<(string, string)>
                {
                    ("genel", "Text"),
                    ("oyunlar", "Text"),
                    ("lobi", "Voice")
                },
                "friends" => new List<(string, string)>
                {
                    ("genel", "Text"),
                    ("sohbet", "Text"),
                    ("sesli", "Voice")
                },
                "study" => new List<(string, string)>
                {
                    ("karsilama-ve-kurallar", "Text"),
                    ("notlar-kaynaklar", "Text"),
                    ("genel", "Text"),
                    ("odev-yardimi", "Text"),
                    ("oturum-planlama", "Text"),
                    ("konu-disi", "Text"),
                    ("salon", "Voice"),
                    ("calisma-odasi-1", "Voice"),
                    ("calisma-odasi-2", "Voice")
                },
                "school" => new List<(string, string)>
                {
                    ("duyurular", "Text"),
                    ("genel", "Text"),
                    ("odevler", "Text"),
                    ("etkinlikler", "Text"),
                    ("lobi", "Voice")
                },
                _ => new List<(string, string)>
                {
                    ("genel", "Text"),
                    ("genel-ses", "Voice")
                }
            };
        }
    }
}
