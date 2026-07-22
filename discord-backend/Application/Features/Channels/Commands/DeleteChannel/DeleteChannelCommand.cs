using MediatR;
using System;

namespace Application.Features.Channels.Commands.DeleteChannel
{
    public class DeleteChannelCommand : IRequest<object>
    {
        public Guid ChannelId { get; set; }
    }
}
