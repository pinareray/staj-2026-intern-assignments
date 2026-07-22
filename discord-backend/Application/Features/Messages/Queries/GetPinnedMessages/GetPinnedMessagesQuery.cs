using Application.Features.Messages.Queries.GetMessagesByChannel;
using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Messages.Queries.GetPinnedMessages
{
    public class GetPinnedMessagesQuery : IRequest<List<MessageDto>>
    {
        public Guid ChannelId { get; set; }
    }
}
