using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Users.Commands.DeleteAccount
{
    public class DeleteAccountCommandHandler : IRequestHandler<DeleteAccountCommand, object>
    {
        private readonly IUserContextService _userContextService;
        private readonly IUserRepository _userRepository;

        public DeleteAccountCommandHandler(
            IUserContextService userContextService,
            IUserRepository userRepository)
        {
            _userContextService = userContextService;
            _userRepository = userRepository;
        }

        public async Task<object> Handle(
            DeleteAccountCommand request,
            CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            await _userRepository.DeleteUserAsync(userId);
            return new { deleted = true };
        }
    }
}
