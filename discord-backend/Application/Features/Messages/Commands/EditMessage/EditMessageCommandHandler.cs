using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Commands.EditMessage
{
    public class EditMessageCommandHandler : IRequestHandler<EditMessageCommand, object>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;
        private readonly IChatNotificationService _chatNotificationService;

        public EditMessageCommandHandler(
            IMessageRepository messageRepository,
            IUserRepository userRepository,
            IUserContextService userContextService,
            IChatNotificationService chatNotificationService)
        {
            _messageRepository = messageRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
            _chatNotificationService = chatNotificationService;
        }

        public async Task<object> Handle(
            EditMessageCommand request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                throw new Exception("Mesaj içeriği boş olamaz.");
            }

            var message = await _messageRepository.GetByIdAsync(request.MessageId);
            if (message == null)
            {
                throw new Exception("Mesaj bulunamadı.");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            if (message.UserId != currentUserId)
            {
                throw new Exception("Yalnızca kendi mesajınızı düzenleyebilirsiniz.");
            }

            message.Content = request.Content.Trim();
            message.EditedAt = DateTime.UtcNow;
            await _messageRepository.UpdateAsync(message);

            var user = await _userRepository.GetByIdAsync(message.UserId);
            var payload = new
            {
                message.Id,
                message.Content,
                message.UserId,
                Username = user?.Username ?? "Kullanıcı",
                message.ChannelId,
                message.CreatedAt,
                message.EditedAt,
                message.AttachmentUrl,
                IsStarred = false
            };

            await _chatNotificationService.NotifyMessageEditedAsync(
                message.ChannelId.ToString(),
                payload);

            return payload;
        }
    }
}
