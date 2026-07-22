using MediatR;
using System;

namespace Application.Features.Moderation.Queries.GetBlockStatus
{
    public class GetBlockStatusQuery : IRequest<object>
    {
        public Guid UserId { get; set; }
    }
}
