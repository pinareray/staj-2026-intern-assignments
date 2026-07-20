using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Friends.Commands.RejectRequest
{
    public class RejectRequestCommandHandler : IRequestHandler<RejectRequestCommand, object>
    {
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IUserContextService _userContextService;

        public RejectRequestCommandHandler(
            IFriendshipRepository friendshipRepository,
            IUserContextService userContextService)
        {
            _friendshipRepository = friendshipRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(RejectRequestCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var friendship = await _friendshipRepository.GetByIdAsync(request.FriendshipId);

            if (friendship == null)
            {
                throw new Exception("İstek bulunamadı.");
            }

            if (friendship.Status != "Pending")
            {
                throw new Exception("İstek zaten işlenmiş.");
            }

            // Alıcı reddedebilir; gönderen de iptal edebilir.
            if (friendship.AddresseeId != currentUserId && friendship.RequesterId != currentUserId)
            {
                throw new Exception("Bu isteği işlemeye yetkin yok.");
            }

            await _friendshipRepository.DeleteAsync(friendship);

            return new { message = "İstek kaldırıldı." };
        }
    }
}
