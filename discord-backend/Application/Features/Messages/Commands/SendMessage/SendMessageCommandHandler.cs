using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Commands.SendMessage
{
    public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, object>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IUserRepository _userRepository;
        private readonly IChatNotificationService _chatNotificationService;

        public SendMessageCommandHandler(
            IMessageRepository messageRepository,
            IUserRepository userRepository,
            IChatNotificationService chatNotificationService)
        {
            _messageRepository = messageRepository;
            _userRepository = userRepository;
            _chatNotificationService = chatNotificationService;
        }

        public async Task<object> Handle(SendMessageCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                throw new Exception("Mesaj içeriği boş olamaz.");
            }

            var message = new Message
            {
                Id = Guid.NewGuid(),
                Content = request.Content,
                UserId = request.UserId,
                ChannelId = request.ChannelId,
                CreatedAt = DateTime.UtcNow
            };

            await _messageRepository.AddAsync(message);

            var user = await _userRepository.GetByIdAsync(request.UserId);
            var payload = new
            {
                message.Id,
                message.Content,
                message.UserId,
                Username = user?.Username ?? "Kullanıcı",
                message.ChannelId,
                message.CreatedAt
            };

            await _chatNotificationService.SendMessageToChannelAsync(
                request.ChannelId.ToString(),
                payload);

            return payload;
        }
    }
}
