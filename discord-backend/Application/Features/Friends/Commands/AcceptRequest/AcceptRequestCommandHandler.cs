using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Friends.Commands.AcceptRequest
{
    public class AcceptRequestCommandHandler : IRequestHandler<AcceptRequestCommand, object>
    {
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IUserContextService _userContextService;

        public AcceptRequestCommandHandler(
            IFriendshipRepository friendshipRepository,
            IUserContextService userContextService)
        {
            _friendshipRepository = friendshipRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(AcceptRequestCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var friendship = await _friendshipRepository.GetByIdAsync(request.FriendshipId);

            if (friendship == null)
            {
                throw new Exception("İstek bulunamadı.");
            }

            if (friendship.AddresseeId != currentUserId)
            {
                throw new Exception("Bu isteği sadece alıcı kabul edebilir.");
            }

            if (friendship.Status != "Pending")
            {
                throw new Exception("İstek zaten işlenmiş.");
            }

            friendship.Status = "Accepted";
            await _friendshipRepository.UpdateAsync(friendship);

            return new
            {
                friendship.Id,
                friendship.RequesterId,
                friendship.AddresseeId,
                friendship.Status
            };
        }
    }
}
