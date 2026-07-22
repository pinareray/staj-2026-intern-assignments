using MediatR;
using System;

namespace Application.Features.Dms.Commands.MarkDmRead
{
    public class MarkDmReadCommand : IRequest<object>
    {
        public Guid ChannelId { get; set; }
    }
}
