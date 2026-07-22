using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Dms.Commands.MarkDmRead
{
    public class MarkDmReadCommandHandler : IRequestHandler<MarkDmReadCommand, object>
    {
        private readonly IUserContextService _userContextService;
        private readonly IChannelRepository _channelRepository;
        private readonly IChannelMemberRepository _channelMemberRepository;
        private readonly IUserRepository _userRepository;
        private readonly IChatNotificationService _chatNotificationService;

        public MarkDmReadCommandHandler(
            IUserContextService userContextService,
            IChannelRepository channelRepository,
            IChannelMemberRepository channelMemberRepository,
            IUserRepository userRepository,
            IChatNotificationService chatNotificationService)
        {
            _userContextService = userContextService;
            _channelRepository = channelRepository;
            _channelMemberRepository = channelMemberRepository;
            _userRepository = userRepository;
            _chatNotificationService = chatNotificationService;
        }

        public async Task<object> Handle(MarkDmReadCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var channel = await _channelRepository.GetByIdAsync(request.ChannelId);

            if (channel == null || channel.Type != "DM")
            {
                throw new Exception("DM kanalı bulunamadı.");
            }

            var isMember = await _channelMemberRepository.IsMemberAsync(
                request.ChannelId,
                currentUserId);
            if (!isMember)
            {
                throw new Exception("Bu DM kanalına erişim yetkiniz yok.");
            }

            var readAt = DateTime.UtcNow;
            await _channelMemberRepository.UpdateLastReadAsync(
                request.ChannelId,
                currentUserId,
                readAt);

            var user = await _userRepository.GetByIdAsync(currentUserId);
            await _chatNotificationService.SendReadReceiptAsync(
                request.ChannelId.ToString(),
                new
                {
                    channelId = request.ChannelId,
                    userId = currentUserId,
                    username = user?.Username ?? "Kullanıcı",
                    readAt
                });

            return new { channelId = request.ChannelId, read = true, readAt };
        }
    }
}
