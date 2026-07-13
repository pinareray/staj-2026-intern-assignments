using MediatR;

namespace Application.Features.Auth.Commands.Login
{
    // IRequest<string> şu anlama gelir: "Bu komut işlendikten sonra geriye 
    // JWT Token'ı temsil eden bir metin (string) döndürecek."
    public class LoginCommand : IRequest<string>
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}