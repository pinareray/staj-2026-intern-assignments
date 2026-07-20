using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Dms.Queries.GetDms
{
    public class GetDmsQuery : IRequest<List<DmListItemDto>>
    {
    }

    public class DmListItemDto
    {
        public Guid? ChannelId { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? LastMessage { get; set; }
        public DateTime? LastMessageAt { get; set; }
    }
}
