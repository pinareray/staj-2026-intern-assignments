using MediatR;

namespace Application.Features.Auth.Commands.ResetPassword
{
    public class ResetPasswordCommand : IRequest<bool>
    {
        public string Token { get; set; }
        public string NewPassword { get; set; }
    }
}
