using MediatR;

namespace Application.Features.Users.Commands.ChangePassword
{
    public class ChangePasswordCommand : IRequest<bool>
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
