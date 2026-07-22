using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Moderation.Queries.GetBlockStatus
{
    public class GetBlockStatusQueryHandler : IRequestHandler<GetBlockStatusQuery, object>
    {
        private readonly IUserBlockRepository _blockRepository;
        private readonly IUserContextService _userContextService;

        public GetBlockStatusQueryHandler(
            IUserBlockRepository blockRepository,
            IUserContextService userContextService)
        {
            _blockRepository = blockRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            GetBlockStatusQuery request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var iBlocked = await _blockRepository.GetAsync(currentUserId, request.UserId) != null;
            var theyBlocked = await _blockRepository.GetAsync(request.UserId, currentUserId) != null;

            return new
            {
                userId = request.UserId,
                iBlockedThem = iBlocked,
                theyBlockedMe = theyBlocked,
                eitherWay = iBlocked || theyBlocked
            };
        }
    }
}
