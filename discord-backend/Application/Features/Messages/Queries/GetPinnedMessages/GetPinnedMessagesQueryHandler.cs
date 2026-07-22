using Application.Interfaces;
using Application.Repositories;
using Application.Features.Messages.Queries.GetMessagesByChannel;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Queries.GetPinnedMessages
{
    public class GetPinnedMessagesQueryHandler
        : IRequestHandler<GetPinnedMessagesQuery, List<MessageDto>>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IUserRepository _userRepository;
        private readonly IChannelRepository _channelRepository;
        private readonly IChannelMemberRepository _channelMemberRepository;
        private readonly IStarredMessageRepository _starredMessageRepository;
        private readonly IUserContextService _userContextService;

        public GetPinnedMessagesQueryHandler(
            IMessageRepository messageRepository,
            IUserRepository userRepository,
            IChannelRepository channelRepository,
            IChannelMemberRepository channelMemberRepository,
            IStarredMessageRepository starredMessageRepository,
            IUserContextService userContextService)
        {
            _messageRepository = messageRepository;
            _userRepository = userRepository;
            _channelRepository = channelRepository;
            _channelMemberRepository = channelMemberRepository;
            _starredMessageRepository = starredMessageRepository;
            _userContextService = userContextService;
        }

        public async Task<List<MessageDto>> Handle(
            GetPinnedMessagesQuery request,
            CancellationToken cancellationToken)
        {
            var channel = await _channelRepository.GetByIdAsync(request.ChannelId);
            if (channel == null)
            {
                throw new Exception("Kanal bulunamadı.");
            }

            var currentUserId = _userContextService.GetCurrentUserId();

            if (channel.Type == "DM")
            {
                var isMember = await _channelMemberRepository.IsMemberAsync(
                    request.ChannelId,
                    currentUserId);
                if (!isMember)
                {
                    throw new Exception("Bu DM kanalına erişim yetkiniz yok.");
                }
            }

            var messages = await _messageRepository.GetPinnedByChannelIdAsync(request.ChannelId);
            var starredIds = await _starredMessageRepository.GetStarredMessageIdsAsync(
                currentUserId,
                messages.Select(m => m.Id));

            var result = new List<MessageDto>();
            foreach (var message in messages)
            {
                var user = await _userRepository.GetByIdAsync(message.UserId);
                result.Add(new MessageDto
                {
                    Id = message.Id,
                    Content = message.Content,
                    UserId = message.UserId,
                    Username = user?.Username ?? "Bilinmeyen",
                    ChannelId = message.ChannelId,
                    CreatedAt = message.CreatedAt,
                    EditedAt = message.EditedAt,
                    AttachmentUrl = message.AttachmentUrl,
                    IsStarred = starredIds.Contains(message.Id),
                    IsPinned = true
                });
            }

            return result;
        }
    }
}
