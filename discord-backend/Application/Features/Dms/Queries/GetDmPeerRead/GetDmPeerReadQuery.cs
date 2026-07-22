using MediatR;
using System;

namespace Application.Features.Dms.Queries.GetDmPeerRead
{
    public class GetDmPeerReadQuery : IRequest<object>
    {
        public Guid ChannelId { get; set; }
    }
}
