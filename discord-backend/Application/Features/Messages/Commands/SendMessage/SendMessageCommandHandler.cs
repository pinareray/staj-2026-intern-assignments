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
        private readonly IChatNotificationService _chatNotificationService;

        public SendMessageCommandHandler(
            IMessageRepository messageRepository,
            IChatNotificationService chatNotificationService)
        {
            _messageRepository = messageRepository;
            _chatNotificationService = chatNotificationService;
        }

        public async Task<object> Handle(SendMessageCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                throw new Exception("Mesaj içeriği boş olamaz.");
            }

            // 1. Mesajı Supabase'e (Messages tablosu) kalıcı olarak yaz.
            var message = new Message
            {
                Id = Guid.NewGuid(),
                Content = request.Content,
                UserId = request.UserId,
                ChannelId = request.ChannelId,
                CreatedAt = DateTime.UtcNow
            };

            await _messageRepository.AddAsync(message);

            // 2. Kanaldaki canlı dinleyicilere anında fırlat (SignalR).
            var payload = new
            {
                message.Id,
                message.Content,
                message.UserId,
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
