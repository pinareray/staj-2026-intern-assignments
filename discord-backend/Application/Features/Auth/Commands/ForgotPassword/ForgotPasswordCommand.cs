using MediatR;

namespace Application.Features.Auth.Commands.ForgotPassword
{
    // E-posta ile şifre sıfırlama token'ı üretir; test için token string döner.
    public class ForgotPasswordCommand : IRequest<string>
    {
        public string Email { get; set; }
    }
}
