using Application.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Queries.GetMessagesByChannel
{
    public class GetMessagesByChannelQueryHandler
        : IRequestHandler<GetMessagesByChannelQuery, List<MessageDto>>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IUserRepository _userRepository;

        public GetMessagesByChannelQueryHandler(
            IMessageRepository messageRepository,
            IUserRepository userRepository)
        {
            _messageRepository = messageRepository;
            _userRepository = userRepository;
        }

        public async Task<List<MessageDto>> Handle(
            GetMessagesByChannelQuery request,
            CancellationToken cancellationToken)
        {
            var messages = await _messageRepository.GetByChannelIdAsync(request.ChannelId);
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
                    CreatedAt = message.CreatedAt
                });
            }

            return result;
        }
    }
}
