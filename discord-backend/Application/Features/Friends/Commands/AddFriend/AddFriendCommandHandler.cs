using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Friends.Commands.AddFriend
{
    public class AddFriendCommandHandler : IRequestHandler<AddFriendCommand, object>
    {
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;
        private readonly IDmChannelService _dmChannelService;
        private readonly IUserBlockRepository _blockRepository;

        public AddFriendCommandHandler(
            IFriendshipRepository friendshipRepository,
            IUserRepository userRepository,
            IUserContextService userContextService,
            IDmChannelService dmChannelService,
            IUserBlockRepository blockRepository)
        {
            _friendshipRepository = friendshipRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
            _dmChannelService = dmChannelService;
            _blockRepository = blockRepository;
        }

        public async Task<object> Handle(AddFriendCommand request, CancellationToken cancellationToken)
        {
            var username = request.Username.Trim().TrimStart('@');
            if (string.IsNullOrWhiteSpace(username))
            {
                throw new Exception("Kullanıcı adı zorunludur.");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            var target = await _userRepository.GetByUsernameAsync(username);

            if (target == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            if (target.Id == currentUserId)
            {
                throw new Exception("Kendine arkadaşlık isteği gönderemezsin.");
            }

            if (await _blockRepository.IsBlockedEitherWayAsync(currentUserId, target.Id))
            {
                throw new Exception("Engellenmiş bir kullanıcıya istek gönderemezsiniz.");
            }

            var existingRows = await _friendshipRepository.GetAllBetweenUsersAsync(
                currentUserId,
                target.Id);

            if (existingRows.Any(f => f.Status == "Accepted"))
            {
                throw new Exception("Bu kullanıcı zaten arkadaşın.");
            }

            // Karşı taraf zaten istek göndermişse otomatik kabul et.
            var incoming = existingRows.FirstOrDefault(f =>
                f.Status == "Pending" && f.AddresseeId == currentUserId);
            if (incoming != null)
            {
                incoming.Status = "Accepted";
                await _friendshipRepository.UpdateAsync(incoming);
                await _friendshipRepository.DeleteOtherPendingBetweenAsync(
                    incoming.RequesterId,
                    incoming.AddresseeId,
                    incoming.Id);

                var dmChannel = await _dmChannelService.FindOrCreateDmAsync(
                    incoming.RequesterId,
                    incoming.AddresseeId,
                    seedGreeting: true,
                    greetingFromUserId: currentUserId);

                return new
                {
                    incoming.Id,
                    incoming.RequesterId,
                    incoming.AddresseeId,
                    Status = "Accepted",
                    Username = target.Username,
                    DmChannelId = dmChannel.Id,
                    AutoAccepted = true
                };
            }

            if (existingRows.Any(f => f.Status == "Pending" && f.RequesterId == currentUserId))
            {
                throw new Exception("Zaten bekleyen bir istek var.");
            }

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                RequesterId = currentUserId,
                AddresseeId = target.Id,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _friendshipRepository.AddAsync(friendship);

            return new
            {
                friendship.Id,
                friendship.RequesterId,
                friendship.AddresseeId,
                friendship.Status,
                Username = target.Username,
                AutoAccepted = false
            };
        }
    }
}
