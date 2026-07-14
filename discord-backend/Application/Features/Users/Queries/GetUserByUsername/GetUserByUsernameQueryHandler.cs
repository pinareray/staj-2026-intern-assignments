using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Users.Queries.GetUserByUsername
{
    public class GetUserByUsernameQueryHandler
        : IRequestHandler<GetUserByUsernameQuery, PublicProfileDto>
    {
        private readonly IUserRepository _userRepository;

        public GetUserByUsernameQueryHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<PublicProfileDto> Handle(
            GetUserByUsernameQuery request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                throw new Exception("Kullanıcı adı zorunludur.");
            }

            var user = await _userRepository.GetByUsernameAsync(request.Username.Trim());
            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            return new PublicProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                CreatedAt = user.CreatedAt,
                AvatarUrl = null
            };
        }
    }
}
