using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Messages.Queries.GetMessagesByChannel
{
    public class GetMessagesByChannelQuery : IRequest<List<MessageDto>>
    {
        public Guid ChannelId { get; set; }
    }
}
