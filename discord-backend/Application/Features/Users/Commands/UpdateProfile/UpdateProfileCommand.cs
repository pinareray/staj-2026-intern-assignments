using Application.Features.Users.Queries.GetProfile;
using MediatR;

namespace Application.Features.Users.Commands.UpdateProfile
{
    public class UpdateProfileCommand : IRequest<GetProfileResponse>
    {
        public string Username { get; set; }
    }
}
