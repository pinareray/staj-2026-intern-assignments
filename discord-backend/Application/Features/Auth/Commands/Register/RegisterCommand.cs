using MediatR;

namespace Application.Features.Auth.Commands.Register
{
    // IRequest<string>: kayıt başarılı olursa JWT Token döner.
    public class RegisterCommand : IRequest<string>
    {
        public string Email { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
