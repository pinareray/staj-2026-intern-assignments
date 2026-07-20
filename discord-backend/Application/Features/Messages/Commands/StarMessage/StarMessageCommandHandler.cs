using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Commands.StarMessage
{
    public class StarMessageCommandHandler : IRequestHandler<StarMessageCommand, object>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IChannelRepository _channelRepository;
        private readonly IChannelMemberRepository _channelMemberRepository;
        private readonly IStarredMessageRepository _starredMessageRepository;
        private readonly IUserContextService _userContextService;

        public StarMessageCommandHandler(
            IMessageRepository messageRepository,
            IChannelRepository channelRepository,
            IChannelMemberRepository channelMemberRepository,
            IStarredMessageRepository starredMessageRepository,
            IUserContextService userContextService)
        {
            _messageRepository = messageRepository;
            _channelRepository = channelRepository;
            _channelMemberRepository = channelMemberRepository;
            _starredMessageRepository = starredMessageRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(StarMessageCommand request, CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            var message = await _messageRepository.GetByIdAsync(request.MessageId);
            if (message == null)
            {
                throw new Exception("Mesaj bulunamadı.");
            }

            await EnsureChannelAccessAsync(message.ChannelId, userId);
            await _starredMessageRepository.StarAsync(userId, request.MessageId);

            return new { messageId = request.MessageId, isStarred = true };
        }

        private async Task EnsureChannelAccessAsync(Guid channelId, Guid userId)
        {
            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
            {
                throw new Exception("Kanal bulunamadı.");
            }

            if (channel.Type == "DM")
            {
                var isMember = await _channelMemberRepository.IsMemberAsync(channelId, userId);
                if (!isMember)
                {
                    throw new Exception("Bu kanala erişim yetkiniz yok.");
                }
            }
        }
    }
}
