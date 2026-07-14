using Application.Features.Users.Queries.GetProfile;
using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Users.Commands.UpdateProfile
{
    public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, GetProfileResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public UpdateProfileCommandHandler(
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<GetProfileResponse> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                throw new Exception("Kullanıcı adı boş olamaz.");
            }

            var userId = _userContextService.GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            user.Username = request.Username.Trim();
            await _userRepository.UpdateAsync(user);

            return new GetProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
