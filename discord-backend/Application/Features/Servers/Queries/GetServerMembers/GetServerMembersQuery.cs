using MediatR;
using System;

namespace Application.Features.Servers.Queries.GetServerMembers
{
    public class GetServerMembersQuery : IRequest<object>
    {
        public Guid ServerId { get; set; }
    }
}
